import { useState } from "react";
import { FAMILYSEARCH_COLORS } from "./badges";

// Phase 2 — Name entry.
// No account, no login, no database — the name lives only in local state
// for the duration of this flow.
export default function CertificateNameDialog({ onCancel, onSubmit }) {
  const [name, setName] = useState("");

  const trimmed = name.trim();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Personalise your certificate"
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

      <form
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          width: "min(400px, 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          background: "linear-gradient(165deg, #FFFFFF 0%, #F7FAF3 100%)",
          border: "1px solid rgba(135, 185, 64, 0.42)",
          borderRadius: "24px",
          padding: "2.5rem 2rem",
          boxShadow: "0 40px 100px rgba(51, 51, 49, 0.28), inset 0 1px 0 rgba(255,255,255,0.9)",
          animation: "cert-riseIn 460ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both",
        }}
      >
        <div
          style={{
            fontSize: "clamp(1.3rem, 3.4vw, 1.6rem)",
            fontWeight: 600,
            color: FAMILYSEARCH_COLORS.ink,
            fontFamily: "'Roboto Slab', Georgia, serif",
            marginBottom: "0.6rem",
          }}
        >
          Certificate of Achievement
        </div>

        <div
          style={{
            fontSize: "0.95rem",
            color: "rgba(51,51,49,0.68)",
            marginBottom: "1.75rem",
            lineHeight: 1.5,
          }}
        >
          Personalise your certificate by entering your name.
        </div>

        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          autoFocus
          maxLength={60}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "0.85rem 1.1rem",
            borderRadius: "12px",
            border: "1px solid rgba(51,51,49,0.2)",
            background: "#FFFFFF",
            color: FAMILYSEARCH_COLORS.ink,
            fontSize: "1rem",
            marginBottom: "1.5rem",
            outline: "none",
            transition: "border-color 200ms ease, background 200ms ease",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = FAMILYSEARCH_COLORS.primary; e.currentTarget.style.background = "#FFFFFF"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(51,51,49,0.2)"; e.currentTarget.style.background = "#FFFFFF"; }}
        />

        <button
          type="submit"
          disabled={!trimmed}
          style={{
            width: "100%",
            padding: "0.9rem 1.5rem",
            borderRadius: "999px",
            border: `1px solid ${FAMILYSEARCH_COLORS.primary}`,
            background: trimmed ? FAMILYSEARCH_COLORS.primary : "rgba(51,51,49,0.08)",
            color: trimmed ? FAMILYSEARCH_COLORS.ink : "rgba(51,51,49,0.35)",
            fontWeight: 600,
            fontSize: "0.98rem",
            cursor: trimmed ? "pointer" : "not-allowed",
            transition: "transform 200ms ease",
            boxShadow: trimmed ? "0 10px 24px rgba(135, 185, 64, 0.25)" : "none",
          }}
        >
          Generate Certificate
        </button>
      </form>
    </div>
  );
}
