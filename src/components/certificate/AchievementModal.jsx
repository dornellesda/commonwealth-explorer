import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { BADGE_COLORS, BADGE_ICONS, FAMILYSEARCH_COLORS } from "./badges";

// Detect platform for wallet button label
function getWalletLabel() {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "Add to Apple Wallet";
  if (/Android/i.test(ua)) return "Save to Google Wallet";
  return "Add to Wallet";
}

// Minimal wallet card icon
function WalletCardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="1" y="5" width="22" height="14" rx="3" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.5"/>
      <rect x="1" y="9" width="22" height="3" fill="white" fillOpacity="0.2"/>
      <circle cx="17.5" cy="15" r="2.3" fill="#60C37B"/>
      <circle cx="20.5" cy="15" r="2.3" fill="#F5A623" fillOpacity="0.85"/>
    </svg>
  );
}

// Phase 1 — Achievement overlay.
// Museum-quality, calm celebration. Badge is the visual focus; everything
// else (motion, color, copy) stays quiet and confident.
export default function AchievementModal({
  unlocked,
  onClose,
  onViewCertificate,
  onAddToWallet,
  isWalletLoading = false,
  walletError = null,
  hasWalletPass = false,
}) {
  const [walletQrUrl, setWalletQrUrl] = useState(null);

  const handleAddToWalletClick = async () => {
    if (onAddToWallet) {
      const url = await onAddToWallet();
      if (url) {
        setWalletQrUrl(url);
      }
    }
  };

  if (!unlocked) return null;

  const { badgeLevel, levelName } = unlocked;
  const icon = BADGE_ICONS[badgeLevel];
  const accent = BADGE_COLORS[badgeLevel] || { primary: FAMILYSEARCH_COLORS.primary, glow: "rgba(135, 185, 64, 0.42)" };
  const walletLabel = getWalletLabel();

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="Achievement unlocked"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9970,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "rgba(51, 51, 49, 0.42)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        animation: "cert-fadeIn 420ms cubic-bezier(0.22, 1, 0.36, 1) both",
      }}
    >
      <style>{`
        @keyframes cert-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cert-badgeIn {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes cert-glowPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.08); }
        }
        @keyframes cert-riseIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ww-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div
        style={{
          width: "min(420px, 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          background: "linear-gradient(165deg, #FFFFFF 0%, #F7FAF3 100%)",
          border: "1px solid rgba(135, 185, 64, 0.42)",
          borderRadius: "24px",
          padding: "3rem 2.25rem 2.25rem",
          boxShadow: "0 40px 100px rgba(51, 51, 49, 0.28), inset 0 1px 0 rgba(255,255,255,0.9)",
          position: "relative",
          animation: "cert-riseIn 480ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "1px solid rgba(51,51,49,0.16)",
            background: "rgba(51,51,49,0.04)",
            color: "rgba(51,51,49,0.72)",
            fontSize: "1.1rem",
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(135,185,64,0.14)"; e.currentTarget.style.color = FAMILYSEARCH_COLORS.ink; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(51,51,49,0.04)"; e.currentTarget.style.color = "rgba(51,51,49,0.72)"; }}
        >
          ×
        </button>

        {/* Badge medallion with a very gentle glow behind it */}
        <div
          style={{
            position: "relative",
            width: "148px",
            height: "148px",
            marginBottom: "1.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >

          <div
            style={{
              position: "relative",
              width: "160px",
              height: "160px",
              boxSizing: "border-box",
              animation: "cert-badgeIn 620ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: "100%", height: "100%", aspectRatio: "1 / 1", display: "flex", flex: "0 0 auto" }}>
              {icon}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: FAMILYSEARCH_COLORS.primary,
            marginBottom: "0.6rem",
            animation: "cert-riseIn 460ms ease-out 220ms both",
          }}
        >
          Congratulations
        </div>

        <div
          style={{
            fontSize: "1rem",
            color: "rgba(51,51,49,0.7)",
            marginBottom: "0.35rem",
            animation: "cert-riseIn 460ms ease-out 280ms both",
          }}
        >
          You have reached
        </div>

        <div
          style={{
            fontSize: "clamp(1.5rem, 4vw, 1.9rem)",
            fontWeight: 600,
            color: FAMILYSEARCH_COLORS.ink,
            letterSpacing: "0.01em",
            fontFamily: "'Roboto Slab', Georgia, serif",
            lineHeight: 1.3,
            marginBottom: "2.25rem",
            animation: "cert-riseIn 460ms ease-out 340ms both",
          }}
        >
          {levelName}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.7rem",
            width: "100%",
            animation: "cert-riseIn 460ms ease-out 400ms both",
          }}
        >
          {walletQrUrl ? (
            <div style={{
              background: "#fff",
              padding: "1.5rem",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              animation: "cert-fadeIn 300ms ease-out",
            }}>
              <QRCodeSVG
                value={walletQrUrl}
                size={160}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"M"}
              />
              <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#666", fontWeight: 500, lineHeight: 1.4 }}>
                Scan with your phone to add to <strong>Apple Wallet</strong> or <strong>Google Wallet</strong>
              </div>
            </div>
          ) : (
            <>
              {/* Primary CTA — View Certificate */}
          <button
            onClick={onViewCertificate}
            style={{
              width: "100%",
              padding: "0.9rem 1.5rem",
              borderRadius: "999px",
              border: `1px solid ${accent.primary}`,
              background: `linear-gradient(135deg, ${accent.primary} 0%, ${FAMILYSEARCH_COLORS.primary} 100%)`,
              color: FAMILYSEARCH_COLORS.ink,
              fontWeight: 600,
              fontSize: "0.98rem",
              letterSpacing: "0.01em",
              cursor: "pointer",
              transition: "transform 200ms ease, box-shadow 200ms ease",
              boxShadow: `0 10px 24px ${accent.glow}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            View Certificate
          </button>

          {/* Secondary CTA — Add to Wallet (only rendered when callback is provided) */}
          {onAddToWallet && (
            <button
              onClick={isWalletLoading ? undefined : handleAddToWalletClick}
              disabled={isWalletLoading}
              aria-label={hasWalletPass ? `Open ${walletLabel.replace("Add to ", "")}` : walletLabel}
              style={{
                width: "100%",
                padding: "0.85rem 1.5rem",
                borderRadius: "999px",
                border: "1.5px solid rgba(0,0,0,0.14)",
                background: "linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.95rem",
                letterSpacing: "0.01em",
                cursor: isWalletLoading ? "wait" : "pointer",
                transition: "transform 200ms ease, opacity 200ms ease",
                opacity: isWalletLoading ? 0.65 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 8px 20px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
              onMouseEnter={(e) => { if (!isWalletLoading) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {isWalletLoading ? (
                <>
                  <span style={{
                    width: "14px", height: "14px", borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.28)",
                    borderTopColor: "#fff", flexShrink: 0,
                    display: "inline-block",
                    animation: "ww-spin 0.7s linear infinite",
                  }} />
                  Adding to Wallet…
                </>
              ) : hasWalletPass ? (
                <>
                  <WalletCardIcon />
                  Open in Wallet
                </>
              ) : (
                <>
                  <WalletCardIcon />
                  {walletLabel}
                </>
              )}
            </button>
          )}
          </>
          )}

          {/* Error state */}
          {walletError && (
            <div style={{
              fontSize: "0.78rem",
              color: "#c0392b",
              padding: "0.5rem 0.75rem",
              background: "rgba(192,57,43,0.07)",
              borderRadius: "8px",
              textAlign: "center",
              marginTop: "0.1rem",
            }}>
              {walletError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
