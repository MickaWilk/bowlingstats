import { useState } from "react";
import { supabase } from "../lib/supabase";

const S = {
  wrap: { minHeight: "100vh", background: "linear-gradient(160deg,#0a0a18 0%,#0f0f22 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Courier New',monospace" },
  card: { width: "100%", maxWidth: 360, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "28px 20px" },
  title: { margin: "0 0 24px", fontSize: 16, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", background: "linear-gradient(90deg,#e94560 20%,#f0c040 80%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textAlign: "center" },
  input: { width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#eee", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 10 },
  btn: { width: "100%", padding: "13px", background: "#e94560", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 1, marginTop: 6 },
  toggle: { marginTop: 16, textAlign: "center", fontSize: 12, color: "#666" },
  link: { color: "#a78bfa", cursor: "pointer", textDecoration: "underline" },
  error: { fontSize: 12, color: "#f87171", marginBottom: 8 },
  info: { fontSize: 12, color: "#4ade80", marginBottom: 8 },
};

export default function AuthForm() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);

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
    <div style={S.wrap}>
      <div style={S.card}>
        <h1 style={S.title}>🎳 BowlingStats</h1>
        <form onSubmit={submit}>
          {err && <div style={S.error}>{err}</div>}
          {msg && <div style={S.info}>{msg}</div>}
          <input style={S.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          <input style={S.input} type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={mode === "login" ? "current-password" : "new-password"} />
          <button style={S.btn} type="submit" disabled={loading}>
            {loading ? "..." : mode === "login" ? "Connexion" : "Créer mon compte"}
          </button>
        </form>
        <div style={S.toggle}>
          {mode === "login" ? (
            <>Pas encore de compte ?{" "}<span style={S.link} onClick={() => setMode("signup")}>S'inscrire</span></>
          ) : (
            <>Déjà un compte ?{" "}<span style={S.link} onClick={() => setMode("login")}>Connexion</span></>
          )}
        </div>
      </div>
    </div>
  );
}
