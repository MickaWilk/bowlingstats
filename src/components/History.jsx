import { useState } from "react";
import { supabase } from "../lib/supabase";

function avg(scores) {
  if (!scores?.length) return null;
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function History({ sessions, onDeleted }) {
  const [deleting, setDeleting] = useState(null);

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  async function deleteSession(id) {
    setDeleting(id);
    await supabase.from("sessions").delete().eq("id", id);
    setDeleting(null);
    onDeleted?.();
  }

  if (!sessions.length) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ color: "var(--text-3)", fontSize: 14 }}>Aucune session enregistrée.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 12px 24px" }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
        Historique · {sessions.length} sessions
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map(s => {
          const scores = (s.scores || []).filter(Number.isFinite);
          const best = scores.length ? Math.max(...scores) : null;
          const mean = avg(scores);
          return (
            <div key={s.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{formatDate(s.date)}</span>
                  {s.location && <span style={{ fontSize: 11, color: "var(--text-3)" }}>{s.location}</span>}
                  <span style={{ fontSize: 12, color: "var(--text-2)", marginLeft: "auto" }}>
                    <b style={{ color: "var(--gold)" }}>{mean}</b> moy. &nbsp;
                    <b style={{ color: "var(--green)" }}>{best}</b> best &nbsp;
                    <span style={{ color: "var(--text-3)" }}>{scores.length}p</span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => deleteSession(s.id)}
                disabled={deleting === s.id}
                style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {deleting === s.id ? "…" : "×"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
