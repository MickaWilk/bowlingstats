import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthForm() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
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
        <button onClick={signInWithGoogle} style={{
          width: "100%", padding: "13px 16px", background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)", color: "var(--text)", fontSize: 14, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16,
          boxShadow: "var(--shadow)", transition: "opacity var(--transition)"
        }}>
          <GoogleIcon />
          Continuer avec Google
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
