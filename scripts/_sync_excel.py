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
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read().decode('utf-8'))
            title = data.get('title', '')
            log(f'  ✓ Python fetched title: "{title}"')
    except Exception as e:
        log(f'  ✗ Python oEmbed fetch failed: {e}')

    # Fetch page description
    try:
        watch_url = f"https://www.youtube.com/watch?v={video_id}"
        req = urllib.request.Request(watch_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 'Accept-Language': 'en-US'})
        with urllib.request.urlopen(req, timeout=5) as r:
            html = r.read().decode('utf-8')
            match = re.search(r'"shortDescription"\s*:\s*"([^"]+)"', html)
            if match:
                try:
                    # Parse as json string to unescape correctly
                    description = json.loads(f'"{match.group(1)}"')
                    log(f'  ✓ Python fetched description: "{description[:60]}..."')
                except Exception:
                    description = match.group(1).replace('\\n', '\n').replace('\\"', '"').strip()
                    log(f'  ✓ Python fetched description (fallback): "{description[:60]}..."')
            else:
                meta_match = re.search(r'<meta\s+name="description"\s+content="([^"]+)"', html, re.IGNORECASE)
                if meta_match:
                    description = meta_match.group(1).strip()
                    log(f'  ✓ Python fetched description (meta fallback): "{description[:60]}..."')
    except Exception as e:
        log(f'  ✗ Python description fetch failed: {e}')

    return title, description

try:
    log('Reading xlsx as zip...')
    with zipfile.ZipFile(XLSX_PATH, 'r') as z:
        # Read shared strings
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
        
        # Read sheet1
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
                    # Shared string
                    try:
                        idx = int(value_elem.text)
                        cells[col_idx] = shared_strings[idx] if idx < len(shared_strings) else ''
                    except (ValueError, IndexError):
                        cells[col_idx] = ''
                else:
                    cells[col_idx] = value_elem.text or ''
            
            if cells:
                # Find max column
                max_col = max(cells.keys())
                row_list = [cells.get(i, '') for i in range(max_col + 1)]
                rows_data.append(row_list)
    
    log(f'Total rows parsed: {len(rows_data)}')
    if not rows_data:
        raise ValueError("No rows parsed from spreadsheet")

    header = rows_data[0]
    log(f'Header: {header}')

    # Find columns dynamically by matching name
    country_idx = next((i for i, h in enumerate(header) if h and str(h).lower().strip() == 'country'), 0)
    title_idx = next((i for i, h in enumerate(header) if h and str(h).lower().strip() == 'title'), 1)
    desc_idx = next((i for i, h in enumerate(header) if h and str(h).lower().strip() == 'description'), 2)
    link_idx = next((i for i, h in enumerate(header) if h and 'link' in str(h).lower()), 3)
    credit_idx = next((i for i, h in enumerate(header) if h and str(h).lower().strip() == 'credit'), 4)

    log(f"Column mapping -> Country: {country_idx}, Title: {title_idx}, Description: {desc_idx}, Link: {link_idx}, Credit: {credit_idx}")

    # Process data rows
    data_rows = []
    for r in rows_data[1:]:
        if len(r) > max(country_idx, link_idx) and r[country_idx].strip() and r[link_idx].strip():
            data_rows.append(r)

    log(f'Data rows with country+url: {len(data_rows)}')

    # Read existing metadata
    old_data = {}
    for path in [OUTPUT_PATH_SRC, OUTPUT_PATH_PUBLIC]:
        try:
            with open(path, 'r') as f:
                parsed = json.load(f)
            if isinstance(parsed, dict) and parsed:
                old_data = parsed
                log(f'Loaded baseline metadata from {path}')
                break
        except Exception:
            pass
    
    media_by_country = {}
    
    for row in data_rows:
        country = row[country_idx].strip()
        url = row[link_idx].strip()
        credit = row[credit_idx].strip() if len(row) > credit_idx else ''
        excel_title = row[title_idx].strip() if len(row) > title_idx else ''
        excel_desc = row[desc_idx].strip() if len(row) > desc_idx else ''
        
        if not country or not url:
            continue
        
        # Clean URL
        url = re.sub(r'[\s\u00a0]+$', '', url)
        url = re.sub(r'/+$', '', url)
        
        if country not in media_by_country:
            media_by_country[country] = []
        
        is_youtube = bool(re.search(r'youtube\.com|youtu\.be', url, re.IGNORECASE))
        video_id = None
        if is_youtube:
            match = re.search(r'(?:youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]+)', url)
            if match:
                video_id = match.group(1)
        
        # Check if item exists in old data
        old_item = None
        for old_items in old_data.values():
            found = next((item for item in old_items if item.get('url') == url), None)
            if found:
                old_item = found
                break

        item = {
            'url': url,
            'credit': credit or (old_item.get('credit') if old_item else ''),
            'type': 'video' if is_youtube else 'photo',
            'videoId': video_id,
            'title': excel_title or (old_item.get('title') if old_item else ''),
            'description': excel_desc or (old_item.get('description') if old_item else ''),
        }
        if old_item and old_item.get('imageUrl'):
            item['imageUrl'] = old_item['imageUrl']

        # Fetch metadata if missing
        if is_youtube and video_id and (not item['title'] or not item['description'] or '...' in item['description']):
            log(f"Fetching YouTube metadata in python for: {url}")
            t, d = fetch_youtube_metadata(url, video_id)
            if not item['title'] and t:
                item['title'] = t
            if not item['description'] and d:
                item['description'] = d

        media_by_country[country].append(item)
    
    log(f'Countries: {len(media_by_country)}')
    total_items = sum(len(v) for v in media_by_country.values())
    log(f'Total items: {total_items}')
    
    # Write output to both paths
    for path in [OUTPUT_PATH_PUBLIC, OUTPUT_PATH_SRC]:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w') as f:
            json.dump(media_by_country, f, indent=2, ensure_ascii=False)
        log(f'Written to {path}')
    
    # Print sample
    for country in sorted(media_by_country.keys())[:5]:
        log(f'  {country}: {len(media_by_country[country])} items')
    
    log('SUCCESS')
    
except Exception as e:
    log(f'ERROR: {e}')
    import traceback
    log(traceback.format_exc())

# Write log
with open(LOG_PATH, 'w') as f:
    f.write('\n'.join(LOG))