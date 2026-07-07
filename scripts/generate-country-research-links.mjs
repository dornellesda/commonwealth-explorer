import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_WIKI_URL = "https://www.familysearch.org/en/wiki/Main_Page";
const WIKI_ORIGIN = "https://www.familysearch.org";
const COUNTRIES_PATH = path.resolve(__dirname, "../src/data/countries.json");
const OUTPUT_PATH = path.resolve(__dirname, "../src/data/countryResearchLinks.json");
const COUNTRY_RESEARCH_OVERRIDES = {
  "United Kingdom": {
    gettingStartedUrl: "https://www.familysearch.org/en/wiki/United_Kingdom",
    removeGenealogyRecords: true,
  },
};

function decodeHtmlEntities(value = "") {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, codePoint) => {
      const parsed = Number(codePoint);
      return Number.isNaN(parsed) ? _ : String.fromCharCode(parsed);
    });
}

function stripTags(value = "") {
  return decodeHtmlEntities(value.replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

function buildCountryWikiUrl(countryName) {
  const slug = countryName.trim().replace(/\s+/g, "_");
  const encodedSlug = encodeURIComponent(slug).replace(/%2F/gi, "/");
  return `${WIKI_ORIGIN}/en/wiki/${encodedSlug}_Genealogy`;
}

function buildWikiPageUrl(pageName) {
  const slug = pageName.trim().replace(/\s+/g, "_");
  const encodedSlug = encodeURIComponent(slug).replace(/%2F/gi, "/");
  return `${WIKI_ORIGIN}/en/wiki/${encodedSlug}`;
}

function extractLinksFromHtml(pageHtml = "", pageUrl = WIKI_ORIGIN) {
  const links = [];
  const anchorPattern = /<a\b[^>]*href=(['"])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = anchorPattern.exec(pageHtml)) !== null) {
    const rawHref = (match[2] || "").trim();
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("javascript:")) {
      continue;
    }

    const title = stripTags(match[3] || "");
    if (!title) {
      continue;
    }

    try {
      const url = new URL(rawHref, pageUrl).toString();
      links.push({
        title,
        url,
      });
    } catch {
      // Ignore malformed URLs.
    }
  }

  return links;
}

function findMatch(links, phrase) {
  const lookup = phrase.toLowerCase();
  const matches = links.filter((item) => {
    let hostname = "";
    let pathname = "";
    try {
      const parsed = new URL(item.url);
      hostname = parsed.hostname.toLowerCase();
      pathname = parsed.pathname.toLowerCase();
    } catch {
      return false;
    }

    const isFamilySearchWiki = hostname.endsWith("familysearch.org") && pathname.startsWith("/en/wiki/");
    if (!isFamilySearchWiki) {
      return false;
    }

    const title = item.title.toLowerCase();
    const url = item.url.toLowerCase();
    return title.includes(lookup) || url.includes(lookup.replace(/\s+/g, "_"));
  });

  if (!matches.length) {
    return null;
  }

  const titlePriority = matches.find((item) => item.title.toLowerCase().includes(lookup));
  return titlePriority || matches[0];
}

function buildSectionFallback(countryName, sectionTitle, fallbackUrl) {
  return {
    title: `${countryName} ${sectionTitle}`,
    url: fallbackUrl,
  };
}

async function fetchPageText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent": "Mozilla/5.0 (compatible; FamilySearchWikiResearchBot/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function main() {
  console.log(`Base Wiki: ${BASE_WIKI_URL}`);

  const countryRaw = await readFile(COUNTRIES_PATH, "utf8");
  const countries = JSON.parse(countryRaw);

  const output = {};

  for (const country of countries) {
    const countryName = country.name;
    const wikiUrl = buildCountryWikiUrl(countryName);

    let links = [];
    let gettingStarted = null;
    let onlineResearchHelp = null;
    let genealogyRecords = null;

    try {
      const pageText = await fetchPageText(wikiUrl);
      links = extractLinksFromHtml(pageText, wikiUrl);

      gettingStarted = findMatch(links, "Getting Started");
      onlineResearchHelp = findMatch(links, "Online Research Help");
      genealogyRecords = findMatch(links, "Genealogy Records");
    } catch (error) {
      console.warn(`Failed to scan wiki for ${countryName}: ${error.message}`);
    }

    if (!gettingStarted) {
      gettingStarted = buildSectionFallback(
        countryName,
        "Getting Started",
        buildWikiPageUrl(`${countryName}_Getting_Started`)
      );
    }

    if (!onlineResearchHelp) {
      onlineResearchHelp = buildSectionFallback(
        countryName,
        "Online Research Help",
        buildWikiPageUrl("Online_Research_Help")
      );
    }

    if (!genealogyRecords) {
      genealogyRecords = buildSectionFallback(
        countryName,
        "Genealogy Records",
        buildWikiPageUrl(`${countryName}_Online_Genealogy_Records`)
      );
    }

    const override = COUNTRY_RESEARCH_OVERRIDES[countryName];
    if (override?.gettingStartedUrl) {
      gettingStarted = {
        title: `${countryName} Getting Started`,
        url: override.gettingStartedUrl,
      };
    }

    if (override?.removeGenealogyRecords) {
      genealogyRecords = null;
    }

    output[countryName] = {
      wikiUrl,
      ...(gettingStarted
        ? {
            gettingStarted: {
              title: gettingStarted.title,
              url: gettingStarted.url,
            },
          }
        : {}),
      ...(onlineResearchHelp
        ? {
            onlineResearchHelp: {
              title: onlineResearchHelp.title,
              url: onlineResearchHelp.url,
            },
          }
        : {}),
      ...(genealogyRecords
        ? {
            genealogyRecords: {
              title: genealogyRecords.title,
              url: genealogyRecords.url,
            },
          }
        : {}),
    };

    console.log(`Country: ${countryName}`);
    console.log(`Wiki URL: ${wikiUrl}`);
    console.log(`Links Found: ${links.length}`);
    console.log(
      `Getting Started: ${gettingStarted ? `${gettingStarted.title} | ${gettingStarted.url}` : "Not found"}`
    );
    console.log(
      `Online Research Help: ${
        onlineResearchHelp ? `${onlineResearchHelp.title} | ${onlineResearchHelp.url}` : "Not found"
      }`
    );
    console.log(
      `Genealogy Records: ${
        genealogyRecords ? `${genealogyRecords.title} | ${genealogyRecords.url}` : "Not found"
      }`
    );

    if (!gettingStarted && !onlineResearchHelp && !genealogyRecords) {
      console.warn(`Missing research links for ${countryName}`);
    }

    console.log("");
  }

  await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Saved research links to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("Failed to generate country research links:", error);
  process.exitCode = 1;
});
