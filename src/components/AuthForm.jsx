import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthForm() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function signInWithGitHub() {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: window.location.origin },
    });
  }

  async function submit(e) {
    e.preventDefault();
    setErr(null); setMsg(null); setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErr(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setErr(error.message);
      else setMsg("Vérifie tes emails pour confirmer ton compte.");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎳</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", letterSpacing: -0.5 }}>BowlingStats</h1>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>Suis ta progression, partie après partie.</p>
        </div>

        {/* Google */}
        <button onClick={signInWithGitHub} style={{
          width: "100%", padding: "13px 16px", background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)", color: "var(--text)", fontSize: 14, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16,
          boxShadow: "var(--shadow)", transition: "opacity var(--transition)"
        }}>
          <GitHubIcon />
          Continuer avec GitHub
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>ou</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Email form */}
        <form onSubmit={submit}>
          {err && <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 10, padding: "8px 12px", background: "rgba(248,113,113,0.1)", borderRadius: "var(--radius-sm)" }}>{err}</div>}
          {msg && <div style={{ fontSize: 12, color: "var(--green)", marginBottom: 10, padding: "8px 12px", background: "var(--green-dim)", borderRadius: "var(--radius-sm)" }}>{msg}</div>}

          <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          <input style={{ ...inputStyle, marginBottom: 12 }} type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={mode === "login" ? "current-password" : "new-password"} />

          <button style={btnStyle} type="submit" disabled={loading}>
            {loading ? "…" : mode === "login" ? "Connexion" : "Créer mon compte"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-2)", marginTop: 16 }}>
          {mode === "login" ? "Pas encore de compte ? " : "Déjà un compte ? "}
          <span style={{ color: "var(--primary)", cursor: "pointer", fontWeight: 600 }}
            onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setErr(null); setMsg(null); }}>
            {mode === "login" ? "S'inscrire" : "Connexion"}
          </span>
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)", color: "var(--text)", fontSize: 14, outline: "none",
  marginBottom: 10, transition: "border-color var(--transition)", display: "block",
};

const btnStyle = {
  width: "100%", padding: 13, background: "var(--primary)", border: "none",
  borderRadius: "var(--radius-sm)", color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: 0.3,
};

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}
