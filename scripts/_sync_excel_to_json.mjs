import xlsx from 'xlsx';
import { readFileSync, writeFileSync } from 'fs';

const LOG = [];
function log(msg) {
  LOG.push(msg);
  console.log(msg);
}

const XLSX_PATH = 'media/Media List.xlsx';
const OUTPUT_PATH_PUBLIC = 'public/data/media_data.json';
const OUTPUT_PATH_SRC = 'src/data/media_data.json';
const LOG_PATH = 'scripts/_sync_log.txt';

async function run() {
  try {
    const wb = xlsx.readFile(XLSX_PATH);
    log('Sheets: ' + JSON.stringify(wb.SheetNames));

    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(ws, { defval: '', header: 1 });
    log('Total rows: ' + rows.length);
    if (rows.length === 0) {
      log('No rows found in Excel sheet.');
      return;
    }

    const header = rows[0];
    log('Header: ' + JSON.stringify(header));

    const countryIdx = header.findIndex(h => h && String(h).toLowerCase().trim() === 'country');
    const titleIdx = header.findIndex(h => h && String(h).toLowerCase().trim() === 'title');
    const descIdx = header.findIndex(h => h && String(h).toLowerCase().trim() === 'description');
    const cdnIdx = header.findIndex(h => h && String(h).toLowerCase().trim().includes('cdn'));
    const r2LinkIdx = cdnIdx !== -1 ? cdnIdx : header.findIndex(h => h && (String(h).toLowerCase().trim().includes('r2') || String(h).toLowerCase().trim().includes('mp4')));
    const linkIdx = header.findIndex(h => h && String(h).toLowerCase().trim().includes('link') && r2LinkIdx !== header.indexOf(h));
    const creditIdx = header.findIndex(h => h && String(h).toLowerCase().trim() === 'credit');

    const cIdx = countryIdx !== -1 ? countryIdx : 0;
    const tIdx = titleIdx !== -1 ? titleIdx : 1;
    const dIdx = descIdx !== -1 ? descIdx : 2;
    const lIdx = linkIdx !== -1 ? linkIdx : 3;
    const r2Idx = r2LinkIdx !== -1 ? r2LinkIdx : -1;
    const crIdx = creditIdx !== -1 ? creditIdx : 4;

    log(`Column mapping -> Country: ${cIdx}, Title: ${tIdx}, Description: ${dIdx}, Link: ${lIdx}, R2: ${r2Idx}, Credit: ${crIdx}`);

    const dataRows = rows.slice(1).filter(row => row[cIdx] && (row[lIdx] || (r2Idx !== -1 && row[r2Idx])));
    log('Data rows: ' + dataRows.length);

    // Read existing metadata
    let oldData = {};
    for (const path of [OUTPUT_PATH_SRC, OUTPUT_PATH_PUBLIC]) {
      try {
        const fileContent = readFileSync(path, 'utf8');
        const parsed = JSON.parse(fileContent);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          oldData = parsed;
          log(`Loaded baseline metadata from ${path}`);
          break;
        }
      } catch {}
    }

    const mediaByCountry = {};

    for (const row of dataRows) {
      const country = String(row[cIdx] || '').trim();
      let url = String(row[lIdx] || '').trim();
      let r2Url = r2Idx !== -1 ? String(row[r2Idx] || '').trim() : '';
      const credit = String(row[crIdx] || '').trim();
      const excelTitle = String(row[tIdx] || '').trim();
      const excelDesc = String(row[dIdx] || '').trim();

      if (!url && r2Url) url = r2Url;
      if (!country || !url) continue;

      url = url.replace(/[\s\u00a0]+$/, '').replace(/\/+$/, '');
      if (r2Url) r2Url = r2Url.replace(/[\s\u00a0]+$/, '').replace(/\/+$/, '');

      if (!mediaByCountry[country]) {
        mediaByCountry[country] = [];
      }

      const isDirectR2 = (url.includes('.mp4') || url.includes('.m3u8') || url.includes('r2.dev') || url.includes('cloudflare')) || Boolean(r2Url);
      const isYoutube = !isDirectR2 && /youtube\.com|youtu\.be/i.test(url);
      
      if (!r2Url && isDirectR2) {
        r2Url = url;
      }

      let videoId = null;
      if (isYoutube) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (match) videoId = match[1];
      }

      // Check if item exists in old data
      let oldItem = null;
      for (const oldItems of Object.values(oldData)) {
        const found = oldItems.find(n => n.url === url || (n.r2Url && n.r2Url === r2Url));
        if (found) {
          oldItem = found;
          break;
        }
      }

      const item = {
        url,
        r2Url: r2Url || (oldItem ? oldItem.r2Url : null),
        credit: credit || (oldItem ? oldItem.credit : ''),
        type: (isYoutube || isDirectR2 || (oldItem && oldItem.type === 'video')) ? 'video' : 'photo',
        videoId,
        title: excelTitle || (oldItem ? oldItem.title : ''),
        description: excelDesc || (oldItem ? oldItem.description : ''),
      };

      if (oldItem && oldItem.imageUrl) {
        item.imageUrl = oldItem.imageUrl;
      }

      // Fetch metadata if it's a YouTube video and title/description are missing
      if (item.type === 'video' && item.videoId) {
        if (!item.title) {
          try {
            log(`Fetching YouTube oEmbed title for: ${url}`);
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(item.url)}&format=json`;
            const oembedResp = await fetch(oembedUrl);
            if (oembedResp.ok) {
              const data = await oembedResp.json();
              item.title = data.title || '';
              log(`  ✓ Title fetched: "${item.title}"`);
            } else {
              log(`  ✗ oEmbed response status: ${oembedResp.status}`);
            }
          } catch (err) {
            log(`  ✗ Failed to fetch oEmbed for ${url}: ${err.message}`);
          }
        }

        if (!item.description || item.description.includes('...')) {
          try {
            log(`Fetching YouTube description for video ID: ${item.videoId}`);
            const videoPageUrl = `https://www.youtube.com/watch?v=${item.videoId}`;
            const pageResp = await fetch(videoPageUrl, {
              headers: {
                'Accept-Language': 'en-US',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            });
            if (pageResp.ok) {
              const html = await pageResp.text();
              const shortDescMatch = html.match(/"shortDescription"\s*:\s*"([^"]+)"/);
              if (shortDescMatch) {
                try {
                  item.description = JSON.parse(`"${shortDescMatch[1]}"`).trim();
                  log(`  ✓ Description fetched: "${item.description.slice(0, 60)}..."`);
                } catch {
                  // fallback to raw regex match if JSON parse fails
                  item.description = shortDescMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
                  log(`  ✓ Description fetched (fallback): "${item.description.slice(0, 60)}..."`);
                }
              } else {
                const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
                if (descMatch) {
                  item.description = descMatch[1].trim();
                  log(`  ✓ Description fetched (meta fallback): "${item.description.slice(0, 60)}..."`);
                }
              }
            } else {
              log(`  ✗ Page response status: ${pageResp.status}`);
            }
          } catch (err) {
            log(`  ✗ Failed to fetch page for description: ${err.message}`);
          }
        }
      }

      mediaByCountry[country].push(item);
    }

    log('Countries: ' + Object.keys(mediaByCountry).length);
    log('Total items: ' + Object.values(mediaByCountry).reduce((sum, arr) => sum + arr.length, 0));

    // Write output to both paths
    const outputJSON = JSON.stringify(mediaByCountry, null, 2);
    writeFileSync(OUTPUT_PATH_PUBLIC, outputJSON);
    log('Written to ' + OUTPUT_PATH_PUBLIC);
    writeFileSync(OUTPUT_PATH_SRC, outputJSON);
    log('Written to ' + OUTPUT_PATH_SRC);
    log('SUCCESS');
  } catch (err) {
    log('ERROR: ' + err.message);
    log('Stack: ' + err.stack);
  } finally {
    writeFileSync(LOG_PATH, LOG.join('\n'));
  }
}

run();