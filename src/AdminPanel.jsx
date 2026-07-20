import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "./config";

const ADMIN_TOKEN_STORAGE_KEY = "commonwealth_admin_token";

function splitList(value) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function parseResponsePayload(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

function formFromCountry(country) {
  return {
    name: country?.name || "",
    countryCode: country?.countryCode || "",
    overview: country?.overview || "",
    capital: country?.capital || "",
    population: country?.population || "",
    lat: country?.lat ?? "",
    lng: country?.lng ?? "",
    image: country?.image || "",
    researchHelpsText: (country?.researchHelps || []).join("\n"),
    photosText: (country?.media?.photos || []).join("\n"),
    videosText: (country?.media?.videos || []).join("\n"),
  };
}

const emptyForm = formFromCountry(null);

export default function AdminPanel() {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || "");
  const [password, setPassword] = useState("");
  const [authenticating, setAuthenticating] = useState(false);
  const [countries, setCountries] = useState([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => a.name.localeCompare(b.name)),
    [countries]
  );

  const selectedCountry = useMemo(
    () => countries.find((country) => country.countryCode === selectedCode) || null,
    [countries, selectedCode]
  );

  const apiFetch = async (url, init = {}) => {
    const headers = {
      ...(init.headers || {}),
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...init,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      setAdminToken("");
      throw new Error("Session expired. Please sign in again.");
    }

    return response;
  };

  const loadCountries = async () => {
    if (!adminToken) {
      return;
    }

    setError("");
    try {
      const response = await apiFetch("/api/countries");
      if (!response.ok) {
        throw new Error("Failed to load countries");
      }
      const data = await parseResponsePayload(response);
      setCountries(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message || "Failed to load countries.");
    }
  };

  useEffect(() => {
    loadCountries();
  }, [adminToken]);

  useEffect(() => {
    setForm(formFromCountry(selectedCountry));
  }, [selectedCountry]);

  const onFormChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const uploadMedia = async (file, kind) => {
    if (!file) {
      return;
    }

    setUploading(true);
    setError("");
    setNotice("");

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await apiFetch("/api/upload", {
        method: "POST",
        body,
      });

      const payload = await parseResponsePayload(response);
      if (!response.ok) {
        throw new Error(payload?.error || "Upload failed");
      }

      if (!payload?.url) {
        throw new Error("Upload succeeded but no file URL was returned.");
      }

      setForm((previous) => {
        if (kind === "photo") {
          const nextPhotos = [previous.photosText, payload.url].filter(Boolean).join("\n");
          const nextImage = previous.image || payload.url;
          return {
            ...previous,
            photosText: nextPhotos,
            image: nextImage,
          };
        }

        const nextVideos = [previous.videosText, payload.url].filter(Boolean).join("\n");
        return {
          ...previous,
          videosText: nextVideos,
        };
      });

      setNotice(`${kind === "photo" ? "Photo" : "Video"} uploaded successfully.`);
    } catch (uploadError) {
      setError(uploadError.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const saveCountry = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        name: form.name,
        countryCode: form.countryCode,
        overview: form.overview,
        capital: form.capital,
        population: form.population,
        lat: form.lat,
        lng: form.lng,
        image: form.image,
        researchHelps: splitList(form.researchHelpsText),
        photos: splitList(form.photosText),
        videos: splitList(form.videosText),
      };

      const response = await apiFetch("/api/countries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await parseResponsePayload(response);
      if (!response.ok) {
        throw new Error(result?.error || "Save failed");
      }

      if (!result?.countryCode) {
        throw new Error("Save succeeded but no country payload was returned.");
      }

      setSelectedCode(result.countryCode);
      setNotice("Country saved successfully.");
      await loadCountries();
    } catch (saveError) {
      setError(saveError.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const startNewCountry = () => {
    setSelectedCode("");
    setForm(emptyForm);
    setNotice("");
    setError("");
  };

  const signIn = async (event) => {
    event.preventDefault();
    setAuthenticating(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const payload = await parseResponsePayload(response);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(payload?.error || "Invalid password.");
        }

        if (response.status === 404) {
          throw new Error("Admin API not found. Start the app with npm run dev so the backend is running.");
        }

        throw new Error(payload?.error || `Unable to sign in (HTTP ${response.status}).`);
      }

      if (!payload?.token) {
        throw new Error("Login response did not include a token. Make sure the backend server is running.");
      }

      localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, payload.token);
      setAdminToken(payload.token);
      setPassword("");
      setNotice("Signed in successfully.");
    } catch (authError) {
      const message = authError?.message || "Unable to sign in.";
      if (/failed to fetch/i.test(message)) {
        setError("Cannot reach admin backend. Run npm run dev and try again.");
      } else {
        setError(message);
      }
    } finally {
      setAuthenticating(false);
    }
  };

  const signOut = async () => {
    try {
      if (adminToken) {
        await apiFetch("/api/admin/logout", {
          method: "POST",
        });
      }
    } catch (_) {
      // Ignore logout failures and clear local session anyway.
    } finally {
      localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      setAdminToken("");
      setCountries([]);
      setSelectedCode("");
      setForm(emptyForm);
      setNotice("");
      setError("");
    }
  };

  if (!adminToken) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f2f7ee",
          color: "#163126",
          fontFamily: "'Noto Sans', 'Segoe UI', sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <form
          onSubmit={signIn}
          style={{ width: "min(430px, 100%)", background: "#fff", borderRadius: "14px", padding: "1.3rem", boxShadow: "0 14px 34px rgba(22,49,38,0.12)", border: "1px solid rgba(22,49,38,0.12)", display: "grid", gap: "0.8rem" }}
        >
          <h1 style={{ margin: 0, fontSize: "1.15rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Admin Sign In
          </h1>
          <p style={{ margin: 0, color: "#45665a", fontSize: "0.9rem" }}>
            Enter the admin password to manage countries and media.
          </p>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid #b9cabf" }}
            />
          </label>
          {error ? <div style={{ color: "#b23d2a", fontSize: "0.88rem" }}>{error}</div> : null}
          <button
            type="submit"
            disabled={authenticating}
            style={{ border: "none", borderRadius: "10px", padding: "0.72rem 0.9rem", background: "#2d6f4e", color: "#fff", cursor: "pointer", fontWeight: 700 }}
          >
            {authenticating ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f2f7ee",
        color: "#163126",
        fontFamily: "'Noto Sans', 'Segoe UI', sans-serif",
        display: "grid",
        gridTemplateColumns: "300px 1fr",
      }}
    >
      <aside style={{ borderRight: "1px solid rgba(22,49,38,0.15)", padding: "1rem", background: "#fff" }}>
        <h1 style={{ margin: 0, fontSize: "1.05rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Country Admin
        </h1>
        <p style={{ marginTop: "0.35rem", color: "#45665a", fontSize: "0.9rem" }}>
          Manage countries, overviews, photos, and videos.
        </p>
        <button
          onClick={startNewCountry}
          style={{ marginBottom: "0.75rem", width: "100%", border: "none", borderRadius: "10px", padding: "0.7rem", cursor: "pointer", background: "#87b940", color: "#fff", fontWeight: 700 }}
        >
          + New Country
        </button>
        <div style={{ maxHeight: "calc(100vh - 190px)", overflowY: "auto", display: "grid", gap: "0.4rem" }}>
          {sortedCountries.map((country) => {
            const active = country.countryCode === selectedCode;
            return (
              <button
                key={country.countryCode}
                onClick={() => setSelectedCode(country.countryCode)}
                style={{
                  textAlign: "left",
                  padding: "0.55rem 0.6rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(22,49,38,0.15)",
                  background: active ? "#eaf5dc" : "#fff",
                  color: "#163126",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600 }}>{country.name}</div>
                <div style={{ fontSize: "0.78rem", opacity: 0.7 }}>{country.countryCode}</div>
              </button>
            );
          })}
        </div>
      </aside>

      <main style={{ padding: "1.3rem 1.5rem 2rem", overflowY: "auto" }}>
        <div style={{ marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <a href="/" style={{ color: "#2d6f4e", fontWeight: 700, textDecoration: "none" }}>
            ← Back to Map
          </a>
          <button
            onClick={signOut}
            style={{ border: "1px solid rgba(22,49,38,0.2)", borderRadius: "8px", background: "#fff", color: "#2d6f4e", padding: "0.35rem 0.6rem", cursor: "pointer", fontWeight: 600 }}
          >
            Sign Out
          </button>
          {notice ? <span style={{ color: "#2d6f4e", fontSize: "0.88rem" }}>{notice}</span> : null}
          {error ? <span style={{ color: "#b23d2a", fontSize: "0.88rem" }}>{error}</span> : null}
        </div>

        <form onSubmit={saveCountry} style={{ display: "grid", gap: "0.85rem", maxWidth: "960px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.8rem" }}>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Name</span>
              <input value={form.name} onChange={(event) => onFormChange("name", event.target.value)} required style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid #b9cabf" }} />
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Country Code (ISO-2)</span>
              <input value={form.countryCode} onChange={(event) => onFormChange("countryCode", event.target.value.toLowerCase())} required maxLength={2} style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid #b9cabf" }} />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "0.8rem" }}>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Capital</span>
              <input value={form.capital} onChange={(event) => onFormChange("capital", event.target.value)} style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid #b9cabf" }} />
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Population</span>
              <input value={form.population} onChange={(event) => onFormChange("population", event.target.value)} style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid #b9cabf" }} />
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Latitude</span>
              <input value={form.lat} onChange={(event) => onFormChange("lat", event.target.value)} style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid #b9cabf" }} />
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Longitude</span>
              <input value={form.lng} onChange={(event) => onFormChange("lng", event.target.value)} style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid #b9cabf" }} />
            </label>
          </div>

          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span>Overview</span>
            <textarea rows={5} value={form.overview} onChange={(event) => onFormChange("overview", event.target.value)} style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid #b9cabf", resize: "vertical" }} />
          </label>

          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span>Main Image URL</span>
            <input value={form.image} onChange={(event) => onFormChange("image", event.target.value)} style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid #b9cabf" }} />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Photo URLs (newline or comma separated)</span>
              <textarea rows={4} value={form.photosText} onChange={(event) => onFormChange("photosText", event.target.value)} style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid #b9cabf", resize: "vertical" }} />
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Video URLs (YouTube or file)</span>
              <textarea rows={4} value={form.videosText} onChange={(event) => onFormChange("videosText", event.target.value)} style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid #b9cabf", resize: "vertical" }} />
            </label>
          </div>

          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span>Research Helps (newline or comma separated)</span>
            <textarea rows={3} value={form.researchHelpsText} onChange={(event) => onFormChange("researchHelpsText", event.target.value)} style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid #b9cabf", resize: "vertical" }} />
          </label>

          <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.65rem", border: "1px dashed #7b9a8c", borderRadius: "8px", cursor: "pointer" }}>
              <span>{uploading ? "Uploading..." : "Upload Photo"}</span>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(event) => uploadMedia(event.target.files?.[0], "photo")} />
            </label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.65rem", border: "1px dashed #7b9a8c", borderRadius: "8px", cursor: "pointer" }}>
              <span>{uploading ? "Uploading..." : "Upload Video"}</span>
              <input type="file" accept="video/*" style={{ display: "none" }} onChange={(event) => uploadMedia(event.target.files?.[0], "video")} />
            </label>
            <button type="submit" disabled={saving} style={{ border: "none", borderRadius: "10px", padding: "0.7rem 0.95rem", background: "#2d6f4e", color: "#fff", cursor: "pointer", fontWeight: 700 }}>
              {saving ? "Saving..." : "Save Country"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
