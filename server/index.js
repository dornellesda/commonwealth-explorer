import "dotenv/config";
import cors from "cors";
import express from "express";
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const dataFilePath = path.join(projectRoot, "src", "data", "countries.json");
const uploadsDir = path.join(projectRoot, "public", "uploads");

const app = express();
const port = Number(process.env.PORT || 4000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const sessionTokens = new Map();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    } catch (error) {
      cb(error, uploadsDir);
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const base = path
      .basename(file.originalname || "file", ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
    const safeBase = base || "file";
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  },
});

const upload = multer({ storage });

function createSessionToken() {
  return randomBytes(32).toString("hex");
}

function getTokenFromRequest(req) {
  const authorization = req.headers.authorization || "";
  if (authorization.startsWith("Bearer ")) {
    return authorization.slice(7).trim();
  }

  const headerToken = req.headers["x-admin-token"];
  return typeof headerToken === "string" ? headerToken.trim() : "";
}

function isValidSessionToken(token) {
  if (!token) {
    return false;
  }

  const expiresAt = sessionTokens.get(token);
  if (!expiresAt) {
    return false;
  }

  if (Date.now() > expiresAt) {
    sessionTokens.delete(token);
    return false;
  }

  return true;
}

function requireAdminAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!isValidSessionToken(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.adminToken = token;
  return next();
}

function normalizeName(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeCountryCode(value = "") {
  return String(value).trim().toLowerCase();
}

function parseList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function readCountries() {
  const raw = await fs.readFile(dataFilePath, "utf8");
  return JSON.parse(raw);
}

async function writeCountries(countries) {
  const sorted = [...countries].sort((a, b) => a.name.localeCompare(b.name));
  await fs.writeFile(dataFilePath, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
}

function upsertCountry(existing, payload) {
  const normalizedName = normalizeName(payload.name || "");
  const normalizedCode = normalizeCountryCode(payload.countryCode || "");

  const index = existing.findIndex((country) => {
    const nameMatch = normalizeName(country.name) === normalizedName;
    const codeMatch = normalizeCountryCode(country.countryCode) === normalizedCode;
    return (normalizedName && nameMatch) || (normalizedCode && codeMatch);
  });

  const previous = index >= 0 ? existing[index] : null;

  const nextCountry = {
    name: payload.name?.trim() || previous?.name || "",
    countryCode: normalizeCountryCode(payload.countryCode || previous?.countryCode || ""),
    overview: payload.overview ?? previous?.overview ?? "",
    capital: payload.capital ?? previous?.capital ?? "",
    population: payload.population ?? previous?.population ?? "",
    records: Array.isArray(previous?.records) ? previous.records : [],
    researchHelps: parseList(payload.researchHelps ?? previous?.researchHelps),
    otherLinks: parseList(payload.otherLinks ?? previous?.otherLinks),
    lat: toNumberOrNull(payload.lat ?? previous?.lat) ?? 0,
    lng: toNumberOrNull(payload.lng ?? previous?.lng) ?? 0,
    image: payload.image?.trim() || previous?.image || "",
    media: {
      photos: parseList(payload.photos ?? previous?.media?.photos),
      videos: parseList(payload.videos ?? previous?.media?.videos),
    },
  };

  if (!nextCountry.name || !nextCountry.countryCode) {
    throw new Error("Both name and countryCode are required.");
  }

  if (index >= 0) {
    existing[index] = nextCountry;
  } else {
    existing.push(nextCountry);
  }

  return nextCountry;
}

// ─── WalletWallet pass endpoints ────────────────────────────────────────────
//
// POST /api/wallet        — create a new pass, returns { shareUrl, serialNumber, googleSaveUrl }
// PUT  /api/wallet/:serial — update an existing pass (live push to all devices)
//
// The WalletWallet API key stays server-side; it is never sent to the browser.

const WALLETWALLET_BASE = "https://api.walletwallet.dev";

function getWalletKey() {
  const key = process.env.WALLETWALLET_KEY || "";
  if (!key || key === "ww_live_placeholder_replace_me") return null;
  return key;
}

app.post("/api/wallet", async (req, res) => {
  const key = getWalletKey();
  if (!key) {
    return res.status(503).json({
      error: "WalletWallet API key not configured. Set WALLETWALLET_KEY in .env."
    });
  }

  try {
    const response = await fetch(`${WALLETWALLET_BASE}/api/passes?format=json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || "WalletWallet error" });
    }

    // Normalise: /api/passes?format=json returns { serialNumber, googleSaveUrl, applePass, shareUrl }
    return res.status(201).json({
      serialNumber: data.serialNumber,
      shareUrl: data.shareUrl,
      googleSaveUrl: data.googleSaveUrl,
    });
  } catch (err) {
    console.error("[wallet] create error:", err);
    return res.status(500).json({ error: "Failed to create wallet pass." });
  }
});

app.put("/api/wallet/:serial", async (req, res) => {
  const key = getWalletKey();
  if (!key) {
    return res.status(503).json({
      error: "WalletWallet API key not configured."
    });
  }

  const { serial } = req.params;

  try {
    const response = await fetch(`${WALLETWALLET_BASE}/api/passes/${serial}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || "WalletWallet error" });
    }

    return res.json(data);
  } catch (err) {
    console.error("[wallet] update error:", err);
    return res.status(500).json({ error: "Failed to update wallet pass." });
  }
});

// ────────────────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/admin/login", (req, res) => {
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const token = createSessionToken();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessionTokens.set(token, expiresAt);

  return res.status(201).json({
    token,
    expiresInSeconds: Math.floor(SESSION_TTL_MS / 1000),
  });
});

app.post("/api/admin/logout", requireAdminAuth, (req, res) => {
  sessionTokens.delete(req.adminToken);
  return res.status(204).send();
});

app.get("/api/countries", requireAdminAuth, async (_req, res) => {
  try {
    const countries = await readCountries();
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: "Failed to read countries." });
  }
});

app.post("/api/countries", requireAdminAuth, async (req, res) => {
  try {
    const countries = await readCountries();
    const nextCountry = upsertCountry(countries, req.body || {});
    await writeCountries(countries);
    res.status(201).json(nextCountry);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to save country." });
  }
});

app.post("/api/upload", requireAdminAuth, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const url = `/uploads/${req.file.filename}`;
  return res.status(201).json({
    url,
    filename: req.file.filename,
    originalName: req.file.originalname,
  });
});

app.listen(port, () => {
  console.log(`Admin backend listening on http://localhost:${port}`);
});
