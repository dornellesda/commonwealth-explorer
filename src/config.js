// API configuration for Commonwealth Explorer
// In local development, Vite proxies '/api' requests to 'http://localhost:4000'.
// In production (GitHub Pages), we point directly to the deployed Render.com backend URL.

export const API_BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? ""
    : "https://commonwealth-explorer-serve.onrender.com";
