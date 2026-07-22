import json
import zipfile
import xml.etree.ElementTree as ET
import re
import os
import urllib.request
import urllib.parse

LOG = []
def log(msg):
    LOG.append(msg)
    print(msg)

XLSX_PATH = 'media/Media List.xlsx'
OUTPUT_PATH_PUBLIC = 'public/data/media_data.json'
OUTPUT_PATH_SRC = 'src/data/media_data.json'
LOG_PATH = 'scripts/_sync_py_log.txt'
CDN_BASE_URL = 'https://pub-commonwealth.r2.dev'

def col_letter_to_index(letter):
    """Convert Excel column letter(s) to 0-based index. A=0, B=1, etc."""
    result = 0
    for ch in letter.upper():
        result = result * 26 + (ord(ch) - ord('A') + 1)
    return result - 1

def parse_cell_ref(ref):
    """Parse 'A1' -> (col_index, row_number)."""
    match = re.match(r'^([A-Z]+)(\d+)$', ref)
    if not match:
        return None, None
    return col_letter_to_index(match.group(1)), int(match.group(2))

def fetch_youtube_metadata(url, video_id):
    title = ""
    description = ""
    # Fetch oEmbed for title
    try:
        oembed_url = f"https://www.youtube.com/oembed?url={urllib.parse.quote(url)}&format=json"
        req = urllib.request.Request(oembed_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read().decode('utf-8'))
            title = data.get('title', '')
            log(f'  ✓ YouTube oEmbed title: "{title}"')
    except Exception as e:
        log(f'  ✗ YouTube oEmbed fetch failed: {e}')

    # Fetch page description
    try:
        watch_url = f"https://www.youtube.com/watch?v={video_id}"
        req = urllib.request.Request(watch_url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
        })
        with urllib.request.urlopen(req, timeout=8) as r:
            html = r.read().decode('utf-8')
            match = re.search(r'"shortDescription"\s*:\s*"([^"]+)"', html)
            if match:
                try:
                    description = json.loads('"' + match.group(1) + '"')
                    log(f'  ✓ YouTube description: "{description[:60]}..."')
                except Exception:
                    description = match.group(1).replace('\\n', '\n').replace('\\"', '"').strip()
                    log(f'  ✓ YouTube description (fallback): "{description[:60]}..."')
            else:
                meta_match = re.search(r'<meta\s+name="description"\s+content="([^"]+)"', html, re.IGNORECASE)
                if meta_match:
                    description = meta_match.group(1).strip()
                    log(f'  ✓ YouTube description (meta fallback): "{description[:60]}..."')
    except Exception as e:
        log(f'  ✗ YouTube description fetch failed: {e}')

    return title, description

try:
    log('Reading xlsx as zip...')
    with zipfile.ZipFile(XLSX_PATH, 'r') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            with z.open('xl/sharedStrings.xml') as f:
                tree = ET.parse(f)
                ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
                for si in tree.findall('.//s:si', ns):
                    text_parts = []
                    for t in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
                        if t.text:
                            text_parts.append(t.text)
                    shared_strings.append(''.join(text_parts))
        
        log(f'Shared strings count: {len(shared_strings)}')
        
        with z.open('xl/worksheets/sheet1.xml') as f:
            tree = ET.parse(f)
        
        ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
        
        rows_data = []
        for row_elem in tree.findall(f'.//{{{ns}}}row'):
            cells = {}
            for cell_elem in row_elem.findall(f'{{{ns}}}c'):
                ref = cell_elem.get('r')
                cell_type = cell_elem.get('t', '')
                value_elem = cell_elem.find(f'{{{ns}}}v')
                
                col_idx, _ = parse_cell_ref(ref)
                if col_idx is None or value_elem is None:
                    continue
                
                if cell_type == 's':
                    try:
                        idx = int(value_elem.text)
                        cells[col_idx] = shared_strings[idx] if idx < len(shared_strings) else ''
                    except (ValueError, IndexError):
                        cells[col_idx] = ''
                else:
                    cells[col_idx] = value_elem.text or ''
            
            if cells:
                max_col = max(cells.keys())
                row_list = [cells.get(i, '') for i in range(max_col + 1)]
                rows_data.append(row_list)
    
    log(f'Total rows parsed: {len(rows_data)}')
    if not rows_data:
        raise ValueError("No rows parsed from spreadsheet")

    header = rows_data[0]
    log(f'Header: {header}')

    country_idx = next((i for i, h in enumerate(header) if h and str(h).lower().strip() == 'country'), 0)
    title_idx = next((i for i, h in enumerate(header) if h and str(h).lower().strip() == 'title'), 1)
    desc_idx = next((i for i, h in enumerate(header) if h and str(h).lower().strip() == 'description'), 2)
    link_idx = next((i for i, h in enumerate(header) if h and 'link' in str(h).lower()), 3)
    credit_idx = next((i for i, h in enumerate(header) if h and str(h).lower().strip() == 'credit'), 4)

    data_rows = []
    for r in rows_data[1:]:
        if len(r) > max(country_idx, link_idx) and r[country_idx].strip() and r[link_idx].strip():
            data_rows.append(r)

    log(f'Data rows with country+url: {len(data_rows)}')

    media_by_country = {}
    
    for row in data_rows:
        country = row[country_idx].strip()
        raw_url = row[link_idx].strip()
        credit = row[credit_idx].strip() if len(row) > credit_idx else ''
        excel_title = row[title_idx].strip() if len(row) > title_idx else ''
        excel_desc = row[desc_idx].strip() if len(row) > desc_idx else ''
        
        if not country or not raw_url:
            continue
        
        raw_url = re.sub(r'[\s\u00a0]+$', '', raw_url)
        raw_url = re.sub(r'/+$', '', raw_url)
        
        if country not in media_by_country:
            media_by_country[country] = []
        
        is_youtube = bool(re.search(r'youtube\.com|youtu\.be', raw_url, re.IGNORECASE))
        video_id = None
        if is_youtube:
            match = re.search(r'(?:youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]+)', raw_url)
            if match:
                video_id = match.group(1)
        
        yt_title, yt_desc = "", ""
        if is_youtube and video_id:
            log(f"Fetching YouTube metadata for [{country}] video ID: {video_id}")
            yt_title, yt_desc = fetch_youtube_metadata(raw_url, video_id)

        title = yt_title or excel_title
        description = yt_desc or excel_desc

        if is_youtube and video_id:
            cdn_url = f"{CDN_BASE_URL}/{video_id}.mp4"
            item = {
                'url': cdn_url,
                'r2Url': cdn_url,
                'youtubeUrl': raw_url,
                'credit': credit,
                'type': 'video',
                'videoId': video_id,
                'title': title,
                'description': description,
            }
        else:
            item = {
                'url': raw_url,
                'credit': credit,
                'type': 'photo',
                'title': title,
                'description': description,
                'imageUrl': raw_url,
            }

        media_by_country[country].append(item)
    
    log(f'Countries with media: {len(media_by_country)}')
    total_items = sum(len(v) for v in media_by_country.values())
    log(f'Total media items: {total_items}')
    
    # Write output to both paths
    for path in [OUTPUT_PATH_PUBLIC, OUTPUT_PATH_SRC]:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(media_by_country, f, indent=2, ensure_ascii=False)
        log(f'Written to {path}')
    
    log('SUCCESS')
    
except Exception as e:
    log(f'ERROR: {e}')
    import traceback
    log(traceback.format_exc())

with open(LOG_PATH, 'w', encoding='utf-8') as f:
    f.write('\n'.join(LOG))