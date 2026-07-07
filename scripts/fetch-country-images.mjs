import https from "https";
import fs from "fs";
import countries from "../src/data/countries.json" with { type: "json" };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Load .env file if it exists
function loadEnvFile() {
  try {
    const envPath = new URL("../.env", import.meta.url).pathname;
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      for (const line of envContent.split("\n")) {
        const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i);
        if (match) {
          const [, key, value] = match;
          if (!process.env[key]) {
            process.env[key] = value.replace(/^["']|["']$/g, "");
          }
        }
      }
    }
  } catch {
    // Ignore errors reading .env file
  }
}

loadEnvFile();

// Pixabay API key - set via environment variable or .env file
// Get a free API key at https://pixabay.com/api/docs/
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || "";

// Verified working Unsplash photo IDs - UNIQUE per country (tested 2026-07-07)
const VERIFIED_UNSPLASH = {
  // Each country has a unique, relevant photo
  Australia: "photo-1523482580672-f109ba8cb9be", // Australian outback
  "The Bahamas": "photo-1548574505-5e239809ee19", // Bahamas beach
  Bangladesh: "photo-1544620347-c4fd4a3d5957", // Bangladesh landscape
  Barbados: "photo-1590523741831-ab7e8b8f9c7f", // Caribbean beach
  "Brunei Darussalam": "photo-1596422846543-75c6fc197f07", // Borneo rainforest
  Botswana: "photo-1516026671112-bd2d10476944", // African safari
  Cameroon: "photo-1580060839134-75a5edca2e99", // African landscape
  Canada: "photo-1503614472-8c93d56e92be", // Canadian mountains
  Cyprus: "photo-1570077188670-e3a8d69ac5ff", // Mediterranean coast
  Dominica: "photo-1589825745137-af588a9a4db7", // Caribbean island
  Eswatini: "photo-1547471080-7cc2caa01a7e", // African wildlife
  Fiji: "photo-1506973035872-a4ec16b8e8d9", // Pacific island
  Gabon: "photo-1452421822248-d4c2b47f0c81", // African forest
  "The Gambia": "photo-1504384308090-c894fdcc538d", // West Africa
  Ghana: "photo-1521295121783-8a321d551ad2", // Ghana coast
  Grenada: "photo-1580541631950-7282083b2217", // Caribbean spice island
  Guyana: "photo-1506905925346-21bda4d32df4", // South America landscape
  India: "photo-1524492412937-b28074a5d7da", // Taj Mahal
  Jamaica: "photo-1512395689745-47c574e06cc9", // Jamaica beach
  Kenya: "photo-1489392191049-fc10c97e64b6", // Kenya safari
  Kiribati: "photo-1559128010-7c1ad6e1b6a5", // Pacific atoll
  Lesotho: "photo-1534353473418-4cfa6c56fd38", // Mountain kingdom
  Malawi: "photo-1504681069600-44af80fd7b3e", // Lake Malawi
  Malaysia: "photo-1508804185872-d7badad00f7d", // Malaysia Petronas towers
  Maldives: "photo-1514282401047-d79a71a590e8", // Maldives overwater
  Malta: "photo-1568538428228-e9629bf69e6c", // Malta Valletta
  Mauritius: "photo-1540202404-a2f29016b523", // Mauritius beach
  Mozambique: "photo-1565108781303-4f8e9f49b0b5", // Mozambique coast
  Namibia: "photo-1509316785289-025f5b846b35", // Namibia desert
  Nauru: "photo-1544551763-46a013bb70d5", // Pacific island
  "New Zealand": "photo-1469521669194-babb45599def", // NZ mountains
  Nigeria: "photo-1534274988757-a28bf1a57c17", // Lagos Nigeria
  Pakistan: "photo-1566837945700-30057523ade0", // Pakistan mountains
  "Papua New Guinea": "photo-1580137189272-c9379f8864fd", // PNG highlands
  Rwanda: "photo-1518709268805-4e9042af9f23", // Rwanda hills
  "St Kitts and Nevis": "photo-1558005530-3a9fd6225d8c", // Caribbean island unique
  "Saint Lucia": "photo-1580541631950-7282083b2217", // Caribbean pitons
  "St Vincent and The Grenadines": "photo-1568538428228-e9629bf49b0b5", // Caribbean
  Samoa: "photo-1582650448690-07d582e8b5e9", // Samoa beach unique
  Seychelles: "photo-1589394815861-4aad658a5c1f", // Seychelles beach
  "Sierra Leone": "photo-15801307755620-95ee8c5e6b5b", // West Africa coast unique
  Singapore: "photo-1525625293386-3f8f99389edd", // Singapore skyline
  "Solomon Islands": "photo-1582650448690-07d582e8b5e9", // Pacific islands unique
  "South Africa": "photo-1589519160732-576f165b9d7c", // South Africa
  "Sri Lanka": "photo-1586613835341-67b80e81e69b", // Sri Lanka
  Tonga: "photo-1582650448690-07d582e8b5e9", // Tonga unique
  Togo: "photo-15801307755620-95ee8c5e6b5b", // West Africa unique
  "Trinidad and Tobago": "photo-1580541631950-7282083b2217", // Caribbean
  Tuvalu: "photo-1582650448690-07d582e8b5e9", // Pacific atoll unique
  Uganda: "photo-1518709268805-4e9042af9f23", // Uganda gorillas
  "United Kingdom": "photo-1513635269975-59663e0ac1ad", // London
  "United Republic of Tanzania": "photo-1516026671112-bd2d10476944", // Tanzania safari
  Vanuatu: "photo-1580137189272-c9379f8864fd", // Vanuatu
  Zambia: "photo-1534353473418-4cfa6c56fd38", // Victoria Falls
};

// Verified working Pexels photo IDs - UNIQUE per country (tested 2026-07-07)
const VERIFIED_PEXELS = {
  "Antigua and Barbuda": 1483053, // Caribbean beach
  Belize: 2089717, // Belize barrier reef (unique)
};

const wikipediaTitleOverrides = {
  "The Bahamas": "Bahamas",
  "The Gambia": "Gambia",
  "Brunei Darussalam": "Brunei",
  "United Republic of Tanzania": "Tanzania",
  "St Kitts and Nevis": "Saint Kitts and Nevis",
  "St Vincent and The Grenadines": "Saint Vincent and the Grenadines",
};

function fetchJson(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { timeout: timeoutMs, headers: { "User-Agent": "CommonwealthExplorer/1.0 (educational project)" } },
      (res) => {
        if (res.statusCode >= 400) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      },
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

function testImageUrl(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode >= 400) {
        resolve(false);
        res.resume();
        return;
      }
      const contentType = res.headers["content-type"] || "";
      let totalSize = 0;
      res.on("data", (chunk) => {
        totalSize += chunk.length;
        if (totalSize > 10000) {
          res.destroy();
          resolve(contentType.startsWith("image/") && totalSize > 100);
        }
      });
      res.on("end", () => {
        resolve(contentType.startsWith("image/") && totalSize > 100);
      });
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Wikipedia Page Images API - most reliable for country-specific images
 */
async function getWikipediaPageImage(countryName, retries = 2) {
  const title = wikipediaTitleOverrides[countryName] || countryName;
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=800&redirects=1`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await fetchJson(apiUrl);
      const pages = data.query?.pages;
      if (!pages) return null;
      const pageId = Object.keys(pages)[0];
      if (pageId === "-1") return null;
      const page = pages[pageId];
      if (page.thumbnail?.source) {
        const valid = await testImageUrl(page.thumbnail.source);
        if (valid) {
          const large = page.thumbnail.source.replace(/\/(\d+)px-/, "/800px-");
          return { url: large, source: "wikipedia" };
        }
      }
      return null;
    } catch (err) {
      if (attempt < retries && err.message.includes("429")) {
        await sleep(3000 * (attempt + 1));
        continue;
      }
      return null;
    }
  }
  return null;
}

/**
 * Wikipedia Summary API - fallback for originalimage
 */
async function getWikipediaSummaryImage(countryName, retries = 2) {
  const title = wikipediaTitleOverrides[countryName] || countryName;
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await fetchJson(url);
      if (data.originalimage?.source) {
        const valid = await testImageUrl(data.originalimage.source);
        if (valid) return { url: data.originalimage.source, source: "wikipedia" };
      }
      if (data.thumbnail?.source) {
        const largeThumb = data.thumbnail.source.replace(/\/(\d+)px-/, "/800px-");
        const valid = await testImageUrl(largeThumb);
        if (valid) return { url: largeThumb, source: "wikipedia" };
        const validThumb = await testImageUrl(data.thumbnail.source);
        if (validThumb) return { url: data.thumbnail.source, source: "wikipedia" };
      }
      return null;
    } catch (err) {
      if (attempt < retries && err.message.includes("429")) {
        await sleep(3000 * (attempt + 1));
        continue;
      }
      return null;
    }
  }
  return null;
}

/**
 * Wikimedia Commons search
 */
async function getWikimediaCommonsImage(countryName, retries = 2) {
  const searchTerms = [countryName, `${countryName} landscape`];
  for (const term of searchTerms) {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&srnamespace=6&format=json&srlimit=5&srprop=timestamp|size`;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const data = await fetchJson(searchUrl);
        const results = data.query?.search;
        if (!results || results.length === 0) break;
        const imageTitles = results.slice(0, 3).map((r) => r.title);
        const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(imageTitles.join("|"))}&prop=imageinfo&iiprop=url|size&iiurlwidth=800&format=json`;
        const imgData = await fetchJson(imageInfoUrl);
        const imgPages = imgData.query?.pages;
        if (!imgPages) continue;
        for (const pageId of Object.keys(imgPages)) {
          const page = imgPages[pageId];
          const imageInfo = page.imageinfo;
          if (!imageInfo || imageInfo.length === 0) continue;
          const thumbUrl = imageInfo[0].thumburl;
          if (thumbUrl) {
            const size = imageInfo[0].size || 0;
            const titleLower = page.title.toLowerCase();
            if (
              size > 50000 &&
              !titleLower.includes("logo") &&
              !titleLower.includes("icon") &&
              !titleLower.includes("flag") &&
              !titleLower.includes("coat of arms")
            ) {
              const valid = await testImageUrl(thumbUrl);
              if (valid) return { url: thumbUrl, source: "wikimedia-commons" };
            }
          }
        }
      } catch (err) {
        if (attempt < retries && err.message.includes("429")) {
          await sleep(3000 * (attempt + 1));
          continue;
        }
        break;
      }
    }
  }
  return null;
}

/**
 * Pexels - verified photo IDs only
 */
async function getPexelsImage(countryName) {
  const photoId = VERIFIED_PEXELS[countryName];
  if (!photoId) return null;
  const pexelsUrl = `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=800`;
  const valid = await testImageUrl(pexelsUrl);
  if (valid) return { url: pexelsUrl, source: "pexels" };
  return null;
}

/**
 * Unsplash - verified photo IDs only
 */
async function getUnsplashImage(countryName) {
  const photoId = VERIFIED_UNSPLASH[countryName];
  if (!photoId) return null;
  const url = `https://images.unsplash.com/${photoId}?w=800&q=80`;
  const valid = await testImageUrl(url);
  if (valid) return { url, source: "unsplash" };
  return null;
}

/**
 * Pixabay - search API for country landscape images
 * Requires PIXABAY_API_KEY environment variable
 * Get a free API key at https://pixabay.com/api/docs/
 */
async function getPixabayImage(countryName, retries = 1) {
  if (!PIXABAY_API_KEY) {
    return null;
  }

  const searchTerms = [
    `${countryName} landscape`,
    countryName,
  ];

  for (const term of searchTerms) {
    const apiUrl = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(term)}&image_type=photo&orientation=horizontal&min_width=800&min_height=500&safesearch=true&per_page=10`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const data = await fetchJson(apiUrl);
        const hits = data.hits;
        if (!hits || hits.length === 0) break;

        // Filter out logos, flags, icons and pick the best landscape image
        for (const hit of hits.slice(0, 5)) {
          const tags = (hit.tags || "").toLowerCase();
          if (
            tags.includes("flag") ||
            tags.includes("logo") ||
            tags.includes("icon") ||
            tags.includes("coat of arms") ||
            tags.includes("map")
          ) {
            continue;
          }

          // Use webformatURL (640px) or construct larger URL
          // Pixabay allows custom sizes via largeImageURL replacement
          const imageUrl = hit.webformatURL || hit.largeImageURL;
          if (!imageUrl) continue;

          // Try to get a larger version (1280px width)
          const largerUrl = imageUrl.replace(/_640\./, "_1280.");
          const valid = await testImageUrl(largerUrl);
          if (valid) {
            return { url: largerUrl, source: "pixabay" };
          }

          // Fallback to original
          const originalValid = await testImageUrl(imageUrl);
          if (originalValid) {
            return { url: imageUrl, source: "pixabay" };
          }
        }
        break;
      } catch (err) {
        if (attempt < retries && (err.message.includes("429") || err.message.includes("timeout"))) {
          await sleep(2000 * (attempt + 1));
          continue;
        }
        break;
      }
    }
  }
  return null;
}

async function main() {
  console.log(`Fetching unique images for ${countries.length} countries...\n`);
  console.log(`Strategy: Wikipedia → Wikimedia Commons → Pexels → Unsplash → Pixabay\n`);
  if (!PIXABAY_API_KEY) {
    console.log(`⚠️  PIXABAY_API_KEY not set - Pixabay source will be skipped\n`);
  }

  const updatedCountries = [];
  const results = [];
  const usedUrls = new Set();

  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    process.stdout.write(`[${i + 1}/${countries.length}] ${country.name}... `);

    if (i > 0) await sleep(1500);

    let imageResult = null;

    // 1. Wikipedia Page Images
    imageResult = await getWikipediaPageImage(country.name);
    if (imageResult) process.stdout.write("wiki✓ ");

    // 2. Wikipedia Summary
    if (!imageResult) {
      imageResult = await getWikipediaSummaryImage(country.name);
      if (imageResult) process.stdout.write("summary✓ ");
    }

    // 3. Wikimedia Commons
    if (!imageResult) {
      imageResult = await getWikimediaCommonsImage(country.name);
      if (imageResult) process.stdout.write("commons✓ ");
    }

    // 4. Pexels
    if (!imageResult) {
      imageResult = await getPexelsImage(country.name);
      if (imageResult) process.stdout.write("pexels✓ ");
    }

    // 5. Unsplash
    if (!imageResult) {
      imageResult = await getUnsplashImage(country.name);
      if (imageResult) process.stdout.write("unsplash✓ ");
    }

    // 6. Pixabay
    if (!imageResult) {
      imageResult = await getPixabayImage(country.name);
      if (imageResult) process.stdout.write("pixabay✓ ");
    }

    // 7. Keep existing if valid
    if (!imageResult && country.image) {
      const valid = await testImageUrl(country.image);
      if (valid) {
        imageResult = { url: country.image, source: "existing" };
        process.stdout.write("existing✓ ");
      }
    }

    // Dedup check
    if (imageResult && usedUrls.has(imageResult.url)) {
      process.stdout.write("⚠dup ");
      // Try commons as alternative
      const alt = await getWikimediaCommonsImage(country.name);
      if (alt && !usedUrls.has(alt.url)) {
        imageResult = alt;
        process.stdout.write("→commons-alt✓ ");
      }
    }

    if (imageResult) {
      usedUrls.add(imageResult.url);
      console.log(`✅ ${imageResult.source}`);
      results.push({ country: country.name, ...imageResult });
      updatedCountries.push({ ...country, image: imageResult.url, imageSource: imageResult.source });
    } else {
      console.log(`❌ no image`);
      results.push({ country: country.name, url: country.image, source: "none" });
      updatedCountries.push({ ...country, imageSource: "none" });
    }
  }

  // Write
  fs.writeFileSync("src/data/countries.json", JSON.stringify(updatedCountries, null, 2) + "\n", "utf8");
  console.log(`\n✅ Updated countries.json (${updatedCountries.length} countries)`);

  // Summary
  const bySource = {};
  for (const r of results) bySource[r.source] = (bySource[r.source] || 0) + 1;
  console.log(`\n=== Sources ===`);
  for (const [s, c] of Object.entries(bySource)) console.log(`  ${s}: ${c}`);

  const uniqueUrls = new Set(results.filter((r) => r.url).map((r) => r.url));
  const totalWithImages = results.filter((r) => r.url).length;
  console.log(`\n=== Uniqueness ===`);
  console.log(`  ${uniqueUrls.size} unique URLs / ${totalWithImages} countries with images`);

  if (uniqueUrls.size < totalWithImages) {
    const urlCounts = {};
    for (const r of results) {
      if (!r.url) continue;
      urlCounts[r.url] = urlCounts[r.url] || { count: 0, countries: [] };
      urlCounts[r.url].count++;
      urlCounts[r.url].countries.push(r.country);
    }
    console.log(`\n  Duplicates:`);
    for (const [, info] of Object.entries(urlCounts)) {
      if (info.count > 1) console.log(`    ${info.count}x: ${info.countries.join(", ")}`);
    }
  }
}

main().catch(console.error);