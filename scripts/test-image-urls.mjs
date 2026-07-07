import https from "https";
import countries from "../src/data/countries.json" with { type: "json" };

function testImageUrl(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode >= 400) {
        resolve({ valid: false, status: res.statusCode, url });
        res.resume();
        return;
      }

      const contentType = res.headers["content-type"] || "";
      const contentLength = parseInt(res.headers["content-length"] || "0", 10);

      let totalSize = 0;

      res.on("data", (chunk) => {
        totalSize += chunk.length;
        if (totalSize > 50000) {
          res.destroy();
          resolve({
            valid: true,
            status: res.statusCode,
            contentType,
            contentLength: contentLength || totalSize,
            url,
          });
        }
      });

      res.on("end", () => {
        resolve({
          valid: totalSize > 100,
          status: res.statusCode,
          contentType,
          contentLength: contentLength || totalSize,
          url,
        });
      });
    });

    req.on("error", (err) => {
      resolve({ valid: false, error: err.message, url });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ valid: false, error: "timeout", url });
    });
  });
}

async function main() {
  console.log(`Testing ${countries.length} country image URLs...\n`);

  const urlToCountries = new Map();

  // Group countries by URL to identify duplicates
  for (const country of countries) {
    const url = country.image;
    if (!urlToCountries.has(url)) {
      urlToCountries.set(url, []);
    }
    urlToCountries.get(url).push(country.name);
  }

  console.log(`Found ${urlToCountries.size} unique URLs (out of ${countries.length} countries)\n`);

  // Test each unique URL
  const uniqueUrls = [...urlToCountries.keys()];
  const testResults = new Map();

  for (const url of uniqueUrls) {
    const result = await testImageUrl(url);
    testResults.set(url, result);
    const countriesUsing = urlToCountries.get(url);
    const status = result.valid ? "✅ OK" : "❌ BROKEN";
    const detail = result.valid
      ? `${result.contentType} ${result.contentLength}b`
      : `${result.error || result.status}`;
    const shortUrl = url.replace("https://images.unsplash.com/", "");
    console.log(`${status} ${shortUrl.substring(0, 50)}... → ${detail}`);
    if (countriesUsing.length > 1) {
      console.log(`   Used by ${countriesUsing.length} countries: ${countriesUsing.join(", ")}`);
    }
  }

  // Summary
  const valid = [...testResults.values()].filter((r) => r.valid).length;
  const broken = [...testResults.values()].filter((r) => !r.valid).length;
  console.log(`\n=== Summary ===`);
  console.log(`Valid URLs: ${valid}/${uniqueUrls.length}`);
  console.log(`Broken URLs: ${broken}/${uniqueUrls.length}`);

  // List broken URLs and their countries
  if (broken > 0) {
    console.log(`\n=== Broken URLs ===`);
    for (const [url, result] of testResults) {
      if (!result.valid) {
        const countriesUsing = urlToCountries.get(url);
        console.log(`\nURL: ${url}`);
        console.log(`Error: ${result.error || result.status}`);
        console.log(`Countries: ${countriesUsing.join(", ")}`);
      }
    }
  }

  // List duplicate URLs
  console.log(`\n=== Duplicate URLs (same image for multiple countries) ===`);
  for (const [url, countriesUsing] of urlToCountries) {
    if (countriesUsing.length > 1) {
      const result = testResults.get(url);
      const status = result?.valid ? "✅" : "❌";
      const photoId = url.match(/photo-([a-z0-9-]+)/)?.[1] || url;
      console.log(`${status} ${photoId} → ${countriesUsing.length} countries: ${countriesUsing.join(", ")}`);
    }
  }
}

main().catch(console.error);