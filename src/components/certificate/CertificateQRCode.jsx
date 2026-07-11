import { QRCodeSVG } from "qrcode.react";
import { BADGE_ICONS, BADGE_COLORS, FAMILYSEARCH_LOGO_URL } from "./badges";

// Phase 3 — QR certificate screen.
// The QR code is the primary interaction: large, high-contrast, and
// uncluttered. No account is required — the certificate lives entirely
// in the encoded URL.
export default function CertificateQRCode({ name, badgeLevel, levelName, certificateUrl, onClose }) {
  const icon = BADGE_ICONS[badgeLevel];
  const colors = BADGE_COLORS[badgeLevel] || { primary: "#C9A24B", glow: "rgba(201, 162, 75, 0.35)" };

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="Certificate ready"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9970,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "rgba(10, 12, 18, 0.55)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        animation: "cert-fadeIn 380ms cubic-bezier(0.22, 1, 0.36, 1) both",
      }}
    >
      <style>{`
        @keyframes cert-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cert-riseIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(420px, 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          background: "linear-gradient(165deg, rgba(28, 26, 22, 0.92) 0%, rgba(16, 15, 13, 0.96) 100%)",
          border: "1px solid rgba(201, 162, 75, 0.28)",
          borderRadius: "24px",
          padding: "2.5rem 2rem 2.25rem",
          boxShadow: "0 40px 100px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          animation: "cert-riseIn 460ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            padding: "8px",
            marginBottom: "1rem",
            background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.06), rgba(0,0,0,0.2))",
            border: `1px solid ${colors.primary}55`,
          }}
        >
          {icon}
        </div>

        <div
          style={{
            fontSize: "1.3rem",
            fontWeight: 600,
            color: "#F6F1E7",
            fontFamily: "'Roboto Slab', Georgia, serif",
            marginBottom: "0.4rem",
          }}
        >
          Certificate Ready
        </div>

        <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.15rem" }}>
          Prepared for
        </div>
        <div
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "rgba(201, 162, 75, 0.95)",
            marginBottom: "0.35rem",
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", marginBottom: "1.75rem" }}>
          {levelName}
        </div>

        <div
          style={{
            width: "220px",
            height: "220px",
            padding: "14px",
            borderRadius: "16px",
            background: "#F6F1E7",
            boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.5rem",
          }}
        >
          <QRCodeSVG value={certificateUrl} size={192} level="M" fgColor="#1b1712" bgColor="#F6F1E7" />
        </div>

        <div
          style={{
            fontSize: "0.9rem",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.5,
            marginBottom: "2rem",
          }}
        >
          Scan with your phone to view and save your certificate.
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "0.85rem 1.5rem",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.85)",
            fontWeight: 600,
            fontSize: "0.95rem",
            cursor: "pointer",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
        >
          Close
        </button>

        <img
          src={FAMILYSEARCH_LOGO_URL}
          alt="FamilySearch"
          style={{ width: "110px", height: "auto", opacity: 0.5, marginTop: "1.5rem", filter: "brightness(0) invert(1)" }}
        />
      </div>
    </div>
  );
}
