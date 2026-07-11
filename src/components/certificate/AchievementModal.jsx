import { BADGE_ICONS, BADGE_COLORS } from "./badges";

// Phase 1 — Achievement overlay.
// Museum-quality, calm celebration. Badge is the visual focus; everything
// else (motion, color, copy) stays quiet and confident.
export default function AchievementModal({ unlocked, onClose, onViewCertificate }) {
  if (!unlocked) return null;

  const { badgeLevel, levelName } = unlocked;
  const icon = BADGE_ICONS[badgeLevel];
  const colors = BADGE_COLORS[badgeLevel] || { primary: "#C9A24B", glow: "rgba(201, 162, 75, 0.35)" };

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
        background: "rgba(10, 12, 18, 0.55)",
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
      `}</style>

      <div
        style={{
          width: "min(420px, 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          background: "linear-gradient(165deg, rgba(28, 26, 22, 0.92) 0%, rgba(16, 15, 13, 0.96) 100%)",
          border: "1px solid rgba(201, 162, 75, 0.28)",
          borderRadius: "24px",
          padding: "3rem 2.25rem 2.25rem",
          boxShadow: "0 40px 100px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
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
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.72)",
            fontSize: "1.1rem",
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.72)"; }}
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
              position: "absolute",
              inset: "-18px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${colors.glow} 0%, rgba(0,0,0,0) 70%)`,
              animation: "cert-glowPulse 3.6s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "relative",
              width: "132px",
              height: "132px",
              borderRadius: "50%",
              padding: "14px",
              background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.06), rgba(0,0,0,0.2))",
              border: `1px solid ${colors.primary}55`,
              boxShadow: "0 18px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
              animation: "cert-badgeIn 620ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both",
            }}
          >
            {icon}
          </div>
        </div>

        <div
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(201, 162, 75, 0.92)",
            marginBottom: "0.6rem",
            animation: "cert-riseIn 460ms ease-out 220ms both",
          }}
        >
          Congratulations
        </div>

        <div
          style={{
            fontSize: "1rem",
            color: "rgba(255,255,255,0.62)",
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
            color: "#F6F1E7",
            letterSpacing: "0.01em",
            fontFamily: "'Roboto Slab', Georgia, serif",
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
          <button
            onClick={onViewCertificate}
            style={{
              width: "100%",
              padding: "0.9rem 1.5rem",
              borderRadius: "999px",
              border: "1px solid rgba(201, 162, 75, 0.6)",
              background: "linear-gradient(135deg, #C9A24B 0%, #A47C2C 100%)",
              color: "#1b1712",
              fontWeight: 600,
              fontSize: "0.98rem",
              letterSpacing: "0.01em",
              cursor: "pointer",
              transition: "transform 200ms ease, box-shadow 200ms ease",
              boxShadow: "0 10px 24px rgba(201, 162, 75, 0.25)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            View Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
