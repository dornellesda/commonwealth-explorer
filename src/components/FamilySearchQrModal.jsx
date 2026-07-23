function addCidTracking(url) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('familysearch.org')) return url;
  
  let formattedUrl = url;
  if (formattedUrl.includes('?')) {
    formattedUrl = formattedUrl.replace(/([^/])\?/, '$1/?');
    if (!formattedUrl.includes('CID=')) {
      formattedUrl += '&CID=RE-00063181';
    }
  } else {
    if (!formattedUrl.endsWith('/')) {
      formattedUrl += '/';
    }
    if (!formattedUrl.includes('CID=')) {
      formattedUrl += '?CID=RE-00063181';
    }
  }
  return formattedUrl;
}

export default function FamilySearchQrModal({ destination, title, onClose }) {
  const trackedDestination = addCidTracking(destination);
  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10000, display: "grid", placeItems: "center", padding: "1.5rem",
        background: "rgba(11, 22, 17, 0.48)", backdropFilter: "blur(18px) saturate(135%)", WebkitBackdropFilter: "blur(18px) saturate(135%)",
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Scan a QR code for ${title}`}
        onClick={(event) => event.stopPropagation()}
        style={{
          position: "relative", width: "min(430px, 100%)", padding: ".75rem", borderRadius: "20px",
          color: "#f8fff5", background: "linear-gradient(145deg, rgba(255,255,255,.24), rgba(132,181,96,.11))",
          border: "1px solid rgba(255,255,255,.38)", boxShadow: "0 28px 80px rgba(0,0,0,.38), inset 0 1px 1px rgba(255,255,255,.55)",
          backdropFilter: "blur(32px) saturate(145%)", WebkitBackdropFilter: "blur(32px) saturate(145%)",
        }}
      >
        <button onClick={onClose} aria-label="Close QR code" style={{ position: "absolute", top: "10px", right: "10px", width: "28px", height: "28px", borderRadius: "50%", border: "1px solid rgba(255,255,255,.35)", background: "rgba(255,255,255,.13)", color: "white", fontSize: "1rem", cursor: "pointer" }}>×</button>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: ".85rem", padding: ".15rem", textAlign: "left" }}>
          <div style={{ flex: "0 0 auto", display: "grid", placeItems: "center", width: "96px", height: "96px", padding: "7px", boxSizing: "border-box", borderRadius: "14px", background: "rgba(255,255,255,.96)", border: "1px solid rgba(255,255,255,.78)", boxShadow: "0 8px 18px rgba(0,0,0,.2), inset 0 1px 1px white" }}>
            <QRCodeSVG value={trackedDestination} size={82} level="M" fgColor="#263b23" bgColor="#ffffff" />
          </div>
          <div style={{ flex: "1 1 180px", minWidth: 0, paddingRight: "1.15rem" }}>
            <div style={{ marginBottom: ".32rem", color: "#b7e67b", fontSize: ".64rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase" }}>Scan to continue</div>
            <h3 style={{ margin: 0, fontSize: ".98rem", lineHeight: 1.32 }}>{title}</h3>
          </div>
        </div>
      </section>
    </div>
  );
}
