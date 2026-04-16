import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { ThemeProvider, useTheme } from "./lib/theme";
import AuthForm from "./components/AuthForm";
import SessionForm from "./components/SessionForm";
import Dashboard from "./components/Dashboard";
import History from "./components/History";

const TABS = [
  { id: "add",       icon: "✚", label: "Session" },
  { id: "dashboard", icon: "📊", label: "Stats" },
  { id: "history",   icon: "📋", label: "Historique" },
];

function AppInner() {
  const { pref, setPref } = useTheme();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("add");
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) loadSessions(); }, [session]);

  async function loadSessions() {
    const { data } = await supabase.from("sessions").select("*").order("date", { ascending: true });
    if (data) setSessions(data);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: 32 }}>🎳</span>
    </div>
  );

  if (!session) return <AuthForm />;

  const THEME_ICONS = { light: "☀️", dark: "🌙", system: "💻" };
  const nextTheme = { light: "dark", dark: "system", system: "light" };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 0" }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: -0.3 }}>
          🎳 BowlingStats
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPref(nextTheme[pref])} style={iconBtnStyle} title={`Thème : ${pref}`}>
            {THEME_ICONS[pref]}
          </button>
          <button onClick={() => supabase.auth.signOut()} style={iconBtnStyle}>
            ↩
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ paddingBottom: 80 }}>
        {tab === "add"       && <SessionForm userId={session.user.id} onSaved={() => { loadSessions(); setTab("dashboard"); }} />}
        {tab === "dashboard" && <Dashboard sessions={sessions} />}
        {tab === "history"   && <History sessions={sessions} onDeleted={loadSessions} />}
      </main>

      {/* Bottom nav */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--surface)", borderTop: "1px solid var(--border)", display: "flex", zIndex: 50 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "12px 0 10px", background: "none", border: "none",
            borderTop: tab === t.id ? "2px solid var(--primary)" : "2px solid transparent",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          }}>
            <span style={{ fontSize: 18, opacity: tab === t.id ? 1 : 0.4 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: tab === t.id ? "var(--primary)" : "var(--text-3)", letterSpacing: 0.3 }}>
              {t.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}

const iconBtnStyle = {
  width: 34, height: 34, borderRadius: "var(--radius-sm)", background: "var(--surface-2)",
  border: "1px solid var(--border)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center"
};

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
