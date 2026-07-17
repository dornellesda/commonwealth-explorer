import { readFileSync, writeFileSync } from 'fs';
import xlsx from 'xlsx';

const XLSX_PATH = 'media/Media List.xlsx';
const OUTPUT_PATH_PUBLIC = 'public/data/media_data.json';
const OUTPUT_PATH_SRC = 'src/data/media_data.json';

// Read the spreadsheet
const wb = xlsx.readFile(XLSX_PATH);
const ws = wb.Sheets['Sheet1'];
const rows = xlsx.utils.sheet_to_json(ws, { defval: '', header: 1 });

if (rows.length === 0) {
  console.log('No rows found in Excel sheet.');
  process.exit(1);
}

const header = rows[0];
const countryIdx = header.findIndex(h => h && String(h).toLowerCase().trim() === 'country');
const titleIdx = header.findIndex(h => h && String(h).toLowerCase().trim() === 'title');
const descIdx = header.findIndex(h => h && String(h).toLowerCase().trim() === 'description');
const linkIdx = header.findIndex(h => h && String(h).toLowerCase().trim().includes('link'));
const creditIdx = header.findIndex(h => h && String(h).toLowerCase().trim() === 'credit');

const cIdx = countryIdx !== -1 ? countryIdx : 0;
const tIdx = titleIdx !== -1 ? titleIdx : 1;
const dIdx = descIdx !== -1 ? descIdx : 2;
const lIdx = linkIdx !== -1 ? linkIdx : 3;
const crIdx = creditIdx !== -1 ? creditIdx : 4;

console.log(`Column mapping -> Country: ${cIdx}, Title: ${tIdx}, Description: ${dIdx}, Link: ${lIdx}, Credit: ${crIdx}`);

// Skip header row
const dataRows = rows.slice(1).filter(row => row[cIdx] && row[lIdx]);

const mediaByCountry = {};

for (const row of dataRows) {
  const country = String(row[cIdx] || '').trim();
  let url = String(row[lIdx] || '').trim();
  const credit = String(row[crIdx] || '').trim();
  const excelTitle = String(row[tIdx] || '').trim();
  const excelDesc = String(row[dIdx] || '').trim();

  if (!country || !url) continue;

  // Clean URL - remove trailing whitespace and trailing slash
  url = url.replace(/[\s\u00a0]+$/, '').replace(/\/+$/, '');

  if (!mediaByCountry[country]) {
    mediaByCountry[country] = [];
  }

  // Determine if YouTube or Colourful Heritage
  const isYoutube = /youtube\.com|youtu\.be/i.test(url);
  // Extract video ID for YouTube
  let videoId = null;
  if (isYoutube) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (match) videoId = match[1];
  }

  mediaByCountry[country].push({
    url,
    credit,
    type: isYoutube ? 'video' : 'photo',
    videoId,
    title: excelTitle,
    description: excelDesc,
  });
}

// Now try to fetch metadata for each item
async function fetchMetadata() {
  for (const [country, items] of Object.entries(mediaByCountry)) {
    for (const item of items) {
      try {
        if (item.type === 'video' && item.videoId) {
          if (!item.title) {
            // Fetch YouTube oEmbed for title
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(item.url)}&format=json`;
            const oembedResp = await fetch(oembedUrl);
            if (oembedResp.ok) {
              const data = await oembedResp.json();
              item.title = data.title || '';
            }
          }
          
          if (!item.description) {
            // Try to get the YouTube video page for the description
            try {
              const videoPageUrl = `https://www.youtube.com/watch?v=${item.videoId}`;
              const pageResp = await fetch(videoPageUrl, {
                headers: { 'Accept-Language': 'en-US' }
              });
              if (pageResp.ok) {
                const html = await pageResp.text();
                const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
                if (descMatch) {
                  item.description = descMatch[1].trim();
                }
              }
            } catch {}
          }
        } else {
          // Fetch Colourful Heritage page for OG tags
          const resp = await fetch(item.url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MediaExtractor/1.0)' }
          });
          if (resp.ok) {
            const html = await resp.text();
            
            // Get OG title
            if (!item.title) {
              const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
              if (ogTitleMatch) {
                item.title = ogTitleMatch[1].replace(' - Colourful Heritage', '').trim();
              }
            }
            
            // Get OG description
            if (!item.description) {
              const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
              if (ogDescMatch) {
                item.description = ogDescMatch[1].trim();
              }
            }
            
            // Get OG image
            const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
            if (ogImageMatch) {
              item.imageUrl = ogImageMatch[1].trim();
            }
          }
        }
        console.log(`  ✓ ${country}: ${item.title || item.url}`);
      } catch (err) {
        console.log(`  ✗ ${country}: ${item.url} - ${err.message}`);
      }
    }
  }

  const outputJSON = JSON.stringify(mediaByCountry, null, 2);
  writeFileSync(OUTPUT_PATH_PUBLIC, outputJSON);
  writeFileSync(OUTPUT_PATH_SRC, outputJSON);
  console.log(`\nWritten ${Object.keys(mediaByCountry).length} countries to ${OUTPUT_PATH_PUBLIC} and ${OUTPUT_PATH_SRC}`);
}

console.log('Fetching metadata for media items...\n');
fetchMetadata().catch(console.error);