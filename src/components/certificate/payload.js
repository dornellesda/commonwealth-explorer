// Safe, URL-friendly payload encoding for the certificate QR flow.
// No account, no backend, no database — everything the /certificate
// page needs to render travels inside the URL itself.

export function encodeCertificatePayload(payload) {
  try {
    const json = JSON.stringify(payload);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    // Make URL-safe (RFC 4648 base64url) so it survives copy/paste and QR encoding cleanly.
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch (error) {
    console.error("Failed to encode certificate payload", error);
    return "";
  }
}

export function decodeCertificatePayload(encoded) {
  if (!encoded) return null;
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) base64 += "=";
    const json = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(json);
  } catch (error) {
    console.error("Failed to decode certificate payload", error);
    return null;
  }
}

// The certificate is served from a static, dependency-free redirect file
// (public/certificate.html) so it resolves correctly on GitHub Pages
// without any server-side routing. It immediately forwards the visitor
// into the SPA at "/" with the payload preserved as a query param.
export function buildCertificateUrl(payload) {
  const encoded = encodeCertificatePayload(payload);
  const origin = window.location.origin;
  return `${origin}/certificate.html?p=${encoded}`;
}

export function readCertificatePayloadFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("p");
  return decodeCertificatePayload(encoded);
}
