import { useState } from "react";

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

      <form
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          width: "min(400px, 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          background: "linear-gradient(165deg, rgba(28, 26, 22, 0.92) 0%, rgba(16, 15, 13, 0.96) 100%)",
          border: "1px solid rgba(201, 162, 75, 0.28)",
          borderRadius: "24px",
          padding: "2.5rem 2rem",
          boxShadow: "0 40px 100px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          animation: "cert-riseIn 460ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both",
        }}
      >
        <div
          style={{
            fontSize: "clamp(1.3rem, 3.4vw, 1.6rem)",
            fontWeight: 600,
            color: "#F6F1E7",
            fontFamily: "'Roboto Slab', Georgia, serif",
            marginBottom: "0.6rem",
          }}
        >
          Certificate of Achievement
        </div>

        <div
          style={{
            fontSize: "0.95rem",
            color: "rgba(255,255,255,0.6)",
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
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(255,255,255,0.05)",
            color: "#F6F1E7",
            fontSize: "1rem",
            marginBottom: "1.5rem",
            outline: "none",
            transition: "border-color 200ms ease, background 200ms ease",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201, 162, 75, 0.6)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
        />

        <button
          type="submit"
          disabled={!trimmed}
          style={{
            width: "100%",
            padding: "0.9rem 1.5rem",
            borderRadius: "999px",
            border: "1px solid rgba(201, 162, 75, 0.6)",
            background: trimmed ? "linear-gradient(135deg, #C9A24B 0%, #A47C2C 100%)" : "rgba(255,255,255,0.08)",
            color: trimmed ? "#1b1712" : "rgba(255,255,255,0.35)",
            fontWeight: 600,
            fontSize: "0.98rem",
            cursor: trimmed ? "pointer" : "not-allowed",
            transition: "transform 200ms ease",
            boxShadow: trimmed ? "0 10px 24px rgba(201, 162, 75, 0.25)" : "none",
          }}
        >
          Generate Certificate
        </button>
      </form>
    </div>
  );
}
