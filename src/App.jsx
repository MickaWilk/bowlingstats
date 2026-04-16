import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import AuthForm from "./components/AuthForm";
import SessionForm from "./components/SessionForm";
import Dashboard from "./components/Dashboard";

const TAB = {
  dashboard: "📈",
  add: "✚",
};

const S = {
  app: { background: "linear-gradient(160deg,#0a0a18 0%,#0f0f22 60%,#0d0d1a 100%)", minHeight: "100vh", fontFamily: "'Courier New',monospace" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 14px 0" },
  logo: { fontSize: 13, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", background: "linear-gradient(90deg,#e94560 20%,#f0c040 80%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  logoutBtn: { padding: "5px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#555", fontSize: 10, cursor: "pointer", fontFamily: "inherit" },
  nav: { display: "flex", borderTop: "1px solid rgba(255,255,255,0.07)", position: "fixed", bottom: 0, left: 0, right: 0, background: "#0a0a18", zIndex: 50 },
  navBtn: (active) => ({
    flex: 1, padding: "14px 0", background: "none", border: "none", cursor: "pointer", fontSize: 20,
    borderTop: active ? "2px solid #e94560" : "2px solid transparent",
    opacity: active ? 1 : 0.4,
  }),
  content: { paddingBottom: 70 },
};

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadSessions();
  }, [session]);

  async function loadSessions() {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .order("date", { ascending: true });
    if (data) setSessions(data);
  }

  if (loading) return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <span style={{ color: "#333", fontSize: 20 }}>🎳</span>
    </div>
  );

  if (!session) return <AuthForm />;

  return (
    <div style={S.app}>
      <div style={S.header}>
        <span style={S.logo}>🎳 BowlingStats</span>
        <button style={S.logoutBtn} onClick={() => supabase.auth.signOut()}>Déco</button>
      </div>

      <div style={S.content}>
        {tab === "dashboard" && <Dashboard sessions={sessions} />}
        {tab === "add" && (
          <SessionForm
            userId={session.user.id}
            onSaved={() => { loadSessions(); setTab("dashboard"); }}
          />
        )}
      </div>

      <nav style={S.nav}>
        {Object.entries(TAB).map(([key, icon]) => (
          <button key={key} style={S.navBtn(tab === key)} onClick={() => setTab(key)}>
            {icon}
          </button>
        ))}
      </nav>
    </div>
  );
}
