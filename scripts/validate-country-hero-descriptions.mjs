import fs from "fs";
import countries from "../src/data/countries.json" with { type: "json" };

const REPORT_PATH = new URL("../scripts/hero-validation-report.json", import.meta.url);

const countryAliases = {
  "the bahamas": "bahamas",
  "the gambia": "gambia",
  "brunei darussalam": "brunei",
  "united republic of tanzania": "tanzania",
  "st kitts and nevis": "saint kitts and nevis",
  "st vincent and the grenadines": "saint vincent and the grenadines",
};

function normalize(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getCountryTerms(countryName = "") {
  const raw = normalize(countryName);
  const set = new Set([raw]);

  const alias = countryAliases[raw];
  if (alias) {
    set.add(alias);
  }

  const noThe = raw.replace(/^the\s+/, "").trim();
  if (noThe) {
    set.add(noThe);
  }

  set.add(raw.replace(/\bst\b/g, "saint"));
  set.add(raw.replace(/\bsaint\b/g, "st"));

  return [...set].filter(Boolean);
}

function containsCountryTerm(text = "", countryName = "") {
  const normalizedText = normalize(text);
  if (!normalizedText) {
    return false;
  }

  return getCountryTerms(countryName).some((term) => {
    if (!term) {
      return false;
    }

    const compact = term.replace(/\s+/g, "");
    const spaced = term;
    return (
      normalizedText.includes(spaced) ||
      normalizedText.includes(compact)
    );
  });
}

function parseSourceType(url = "") {
  const lower = url.toLowerCase();

  if (lower.includes("unsplash.com")) return "unsplash";
  if (lower.includes("pexels.com")) return "pexels";
  if (lower.includes("pixabay.com") || lower.includes("cdn.pixabay.com")) return "pixabay";
  if (lower.includes("wikimedia.org") || lower.includes("wikipedia.org")) return "wikimedia";

  return "unknown";
}

async function fetchJson(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "CommonwealthExplorerHeroValidator/1.0" },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function extractUnsplashPhotoId(url = "") {
  const match = url.match(/\/photo-([a-z0-9-]+)(?:\?|$)/i);
  if (match?.[1]) {
    return match[1];
  }

  const second = url.match(/images\.unsplash\.com\/([a-z0-9-]+)(?:\?|$)/i);
  return second?.[1] || null;
}

function extractPexelsPhotoId(url = "") {
  const match = url.match(/\/photos\/(\d+)\//i);
  return match?.[1] || null;
}

async function getUnsplashDescriptor(url = "") {
  const photoId = extractUnsplashPhotoId(url);
  if (!photoId) {
    return { descriptor: url, note: "no-photo-id" };
  }

  const pageUrl = `https://unsplash.com/photos/${photoId}`;
  const oembedUrl = `https://unsplash.com/oembed?url=${encodeURIComponent(pageUrl)}`;

  try {
    const data = await fetchJson(oembedUrl);
    const descriptor = [data?.title, data?.author_name, pageUrl].filter(Boolean).join(" ");
    return { descriptor, note: "oembed" };
  } catch {
    return { descriptor: `${url} ${pageUrl}`, note: "oembed-failed" };
  }
}

async function getPexelsDescriptor(url = "") {
  const photoId = extractPexelsPhotoId(url);
  if (!photoId) {
    return { descriptor: url, note: "no-photo-id" };
  }

  const pageUrl = `https://www.pexels.com/photo/${photoId}/`;
  const oembedUrl = `https://www.pexels.com/oembed/?url=${encodeURIComponent(pageUrl)}`;

  try {
    const data = await fetchJson(oembedUrl);
    const descriptor = [data?.title, data?.author_name, pageUrl].filter(Boolean).join(" ");
    return { descriptor, note: "oembed" };
  } catch {
    return { descriptor: `${url} ${pageUrl}`, note: "oembed-failed" };
  }
}

function getGenericDescriptor(url = "") {
  try {
    const decoded = decodeURIComponent(url);
    return { descriptor: decoded, note: "url" };
  } catch {
    return { descriptor: url, note: "url" };
  }
}

async function getDescriptorForUrl(url = "") {
  const source = parseSourceType(url);

  if (source === "unsplash") {
    return getUnsplashDescriptor(url);
  }

  if (source === "pexels") {
    return getPexelsDescriptor(url);
  }

  return getGenericDescriptor(url);
}

async function main() {
  const report = [];
  let validatedCount = 0;
  let unverifiableCount = 0;
  let failedCount = 0;

  for (const country of countries) {
    const imageUrl = country.image || "";
    const source = parseSourceType(imageUrl);

    if (!imageUrl) {
      failedCount += 1;
      report.push({
        country: country.name,
        source,
        image: imageUrl,
        status: "failed",
        reason: "missing-image-url",
        descriptorNote: "none",
      });
      continue;
    }

    const { descriptor, note } = await getDescriptorForUrl(imageUrl);
    const hasCountryTerm = containsCountryTerm(descriptor, country.name);

    let status = "unverifiable";
    let reason = "insufficient-source-metadata";

    if (hasCountryTerm) {
      status = "validated";
      reason = "country-term-found";
      validatedCount += 1;
    } else if (source === "wikimedia" || source === "unknown") {
      status = "failed";
      reason = "country-term-missing";
      failedCount += 1;
    } else {
      status = "unverifiable";
      reason = "provider-metadata-not-country-specific";
      unverifiableCount += 1;
    }

    report.push({
      country: country.name,
      source,
      image: imageUrl,
      status,
      reason,
      hasCountryTerm,
      descriptorNote: note,
      descriptorSample: descriptor.slice(0, 220),
    });
  }

  const checked = countries.length;
  const summary = {
    checkedAt: new Date().toISOString(),
    total: checked,
    validatedCount,
    unverifiableCount,
    failedCount,
    validatedRate: Number(((validatedCount / checked) * 100).toFixed(2)),
  };

  const output = { summary, results: report };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");

  console.log("Hero validation complete");
  console.log(`Total: ${summary.total}`);
  console.log(`Validated: ${summary.validatedCount}`);
  console.log(`Unverifiable: ${summary.unverifiableCount}`);
  console.log(`Failed: ${summary.failedCount}`);
  console.log(`Validated rate: ${summary.validatedRate}%`);
  console.log(`Report: ${REPORT_PATH.pathname}`);

  if (failedCount > 0) {
    console.log("\nCountries needing manual review:");
    report
      .filter((entry) => entry.status === "failed")
      .forEach((entry) => {
        console.log(`- ${entry.country} (${entry.source}): ${entry.image}`);
      });
  }
}

main().catch((error) => {
  console.error("Validation failed:", error.message);
  process.exitCode = 1;
});
