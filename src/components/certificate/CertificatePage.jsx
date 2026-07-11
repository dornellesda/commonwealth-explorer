import { useEffect, useRef, useState } from "react";
import { BADGE_ICONS, BADGE_COLORS, FAMILYSEARCH_COLORS, LEVEL_NAMES, FAMILYSEARCH_LOGO_URL } from "./badges";
import { readCertificatePayloadFromLocation } from "./payload";

function formatDate(isoDate) {
  try {
    const date = isoDate ? new Date(isoDate) : new Date();
    return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

// Phase 4 — Mobile certificate page, served at /certificate.
// This is a standalone page load (reached by scanning the kiosk QR code),
// so it reads everything it needs from the encoded URL payload rather than
// from any app state — no account, no backend, no database.
export default function CertificatePage() {
  const [payload] = useState(() => readCertificatePayloadFromLocation());
  const certificateRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    document.title = "Certificate of Achievement | FamilySearch Commonwealth Explorer";
  }, []);

  if (!payload || !payload.name) {
    return (
      <div style={styles.notFoundWrap}>
        <img src={FAMILYSEARCH_LOGO_URL} alt="FamilySearch" style={{ width: "160px", marginBottom: "1.5rem" }} />
        <div style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>Certificate not found</div>
        <div style={{ fontSize: "0.95rem", color: "#8a8271", maxWidth: "320px" }}>
          This link is missing its certificate details. Please scan the QR code from the exhibit again.
        </div>
      </div>
    );
  }

  const { name, badgeLevel, level, date } = payload;
  const levelName = level || LEVEL_NAMES[badgeLevel] || "Commonwealth Explorer";
  const icon = BADGE_ICONS[badgeLevel];
  const colors = BADGE_COLORS[badgeLevel] || { primary: FAMILYSEARCH_COLORS.primary, glow: "rgba(135, 185, 64, 0.35)" };
  const displayDate = formatDate(date);

  const handleSaveImage = async () => {
    if (!certificateRef.current) return;
    setExportError("");
    setIsExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(certificateRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `Commonwealth-Explorer-Certificate-${name.replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Save image failed", error);
      setExportError("Couldn't save the image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!certificateRef.current) return;
    setExportError("");
    setIsExporting(true);
    try {
      const [{ toPng }, { default: jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);
      const node = certificateRef.current;
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const { width, height } = node.getBoundingClientRect();
      const orientation = width >= height ? "landscape" : "portrait";
      const pdf = new jsPDF({ orientation, unit: "px", format: [width, height] });
      pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
      pdf.save(`Commonwealth-Explorer-Certificate-${name.replace(/\s+/g, "-")}.pdf`);
    } catch (error) {
      console.error("PDF export failed", error);
      setExportError("Couldn't create the PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    setExportError("");
    const shareData = {
      title: "Commonwealth Explorer Certificate",
      text: `${name} reached ${levelName} on the FamilySearch Commonwealth Explorer.`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        setExportError("Link copied to clipboard.");
        return;
      }
    } catch (error) {
      if (error && error.name === "AbortError") return;
      console.error("Share failed", error);
      setExportError("Couldn't share right now.");
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes cert-riseIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div ref={certificateRef} style={styles.certificate}>
        {/* Extremely subtle contour / paper texture */}
        <svg
          aria-hidden="true"
          style={styles.textureOverlay}
          viewBox="0 0 600 800"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="cert-contours" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#87B940" strokeWidth="0.5" />
              <circle cx="60" cy="60" r="30" fill="none" stroke="#87B940" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="600" height="800" fill="url(#cert-contours)" />
        </svg>

        <div style={styles.certificateInner}>
          <img src={FAMILYSEARCH_LOGO_URL} alt="FamilySearch" style={styles.logo} />

          <div style={styles.eyebrow}>Certificate of Achievement</div>

          <div style={styles.rule} />

          <div style={styles.presentedTo}>Presented to</div>
          <div style={styles.name}>{name}</div>

          <div style={styles.body}>
            in recognition of reaching the level of
            <br />
            <span style={styles.levelName}>{levelName}</span>
          </div>

          <div style={styles.description}>
            for demonstrating growing expertise in Commonwealth family history, records,
            migration stories, and ancestral discovery through the One Commonwealth,
            Many Families experience.
          </div>

          <div style={styles.badgeWrap}>
            <div
              style={{
                ...styles.badgeMedallion,
                border: `1px solid ${colors.primary}66`,
                boxShadow: `0 10px 30px ${colors.glow}`,
              }}
            >
              {icon}
            </div>
          </div>

          <div style={styles.date}>{displayDate}</div>

          <div style={styles.rule} />

          <div style={styles.footer}>FamilySearch Commonwealth Explorer</div>
        </div>
      </div>

      <div style={styles.actions}>
        <button
          onClick={handleSaveImage}
          disabled={isExporting}
          style={{ ...styles.actionButton, ...styles.actionPrimary }}
        >
          Save Image
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={isExporting}
          style={{ ...styles.actionButton, ...styles.actionSecondary }}
        >
          Download PDF
        </button>
        <button
          onClick={handleShare}
          disabled={isExporting}
          style={{ ...styles.actionButton, ...styles.actionSecondary }}
        >
          Share
        </button>
      </div>

      {exportError ? <div style={styles.exportError}>{exportError}</div> : null}
    </div>
  );
}

const SERIF = "'Roboto Slab', Georgia, serif";

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "clamp(1.25rem, 5vw, 3rem) 1rem 3rem",
    boxSizing: "border-box",
    fontFamily: "'Noto Sans', 'Segoe UI', sans-serif",
  },
  notFoundWrap: {
    minHeight: "100vh",
    width: "100%",
    background: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "2rem",
    boxSizing: "border-box",
    fontFamily: "'Noto Sans', 'Segoe UI', sans-serif",
    color: "#333331",
  },
  certificate: {
    position: "relative",
    width: "min(560px, 100%)",
    background: "linear-gradient(165deg, #FFFFFF 0%, #F7FAF3 100%)",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 30px 80px rgba(51, 51, 49, 0.16), 0 2px 0 rgba(255,255,255,0.9) inset",
    border: "1px solid rgba(135, 185, 64, 0.32)",
    animation: "cert-riseIn 520ms cubic-bezier(0.22, 1, 0.36, 1) both",
  },
  textureOverlay: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    opacity: 0.05,
    pointerEvents: "none",
  },
  certificateInner: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "clamp(2rem, 6vw, 3.25rem) clamp(1.5rem, 6vw, 3rem) 2.5rem",
  },
  logo: {
    width: "150px",
    height: "auto",
    marginBottom: "1.75rem",
    opacity: 0.92,
  },
  eyebrow: {
    fontFamily: SERIF,
    fontSize: "clamp(1.3rem, 4.5vw, 1.7rem)",
    fontWeight: 600,
    color: "#333331",
    letterSpacing: "0.02em",
    marginBottom: "1.25rem",
  },
  rule: {
    width: "72px",
    height: "2px",
    background: "linear-gradient(90deg, transparent, #87B940, transparent)",
    margin: "0.25rem 0 1.5rem",
  },
  presentedTo: {
    fontSize: "0.85rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#6A6A67",
    marginBottom: "0.5rem",
  },
  name: {
    fontFamily: SERIF,
    fontSize: "clamp(1.6rem, 6vw, 2.1rem)",
    fontWeight: 600,
    color: "#333331",
    marginBottom: "1.5rem",
    wordBreak: "break-word",
  },
  body: {
    fontSize: "1rem",
    color: "#333331",
    lineHeight: 1.7,
    marginBottom: "1rem",
  },
  levelName: {
    fontFamily: SERIF,
    fontSize: "1.15rem",
    fontWeight: 600,
    color: "#87B940",
  },
  description: {
    fontSize: "0.9rem",
    color: "#5D5D59",
    lineHeight: 1.7,
    maxWidth: "420px",
    marginBottom: "2rem",
  },
  badgeWrap: {
    marginBottom: "1.75rem",
  },
  badgeMedallion: {
    width: "104px",
    height: "104px",
    boxSizing: "border-box",
    borderRadius: "50%",
    padding: "12px",
    background: "radial-gradient(circle at 35% 30%, #FFFFFF, #EDF4E6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  date: {
    fontSize: "0.95rem",
    color: "#333331",
    marginBottom: "1.5rem",
  },
  footer: {
    fontSize: "0.85rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#6A6A67",
    marginTop: "0.25rem",
  },
  actions: {
    width: "min(560px, 100%)",
    display: "flex",
    gap: "0.75rem",
    marginTop: "1.75rem",
    flexWrap: "wrap",
  },
  actionButton: {
    flex: "1 1 140px",
    padding: "0.85rem 1rem",
    borderRadius: "999px",
    fontSize: "0.92rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 180ms ease, opacity 180ms ease",
    border: "1px solid transparent",
  },
  actionPrimary: {
    background: "#87B940",
    color: "#333331",
    border: "1px solid #87B940",
  },
  actionSecondary: {
    background: "rgba(51, 51, 49, 0.06)",
    color: "#333331",
    border: "1px solid rgba(51, 51, 49, 0.18)",
  },
  exportError: {
    marginTop: "1rem",
    fontSize: "0.85rem",
    color: "#333331",
  },
};
