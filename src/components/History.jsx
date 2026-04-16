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
    <div style={{ padding: "20px 16px 32px" }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 20 }}>
        Historique · {sessions.length} sessions
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map(s => {
          const scores = (s.scores || []).filter(Number.isFinite);
          const best = scores.length ? Math.max(...scores) : null;
          const mean = avg(scores);
          return (
            <div key={s.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{formatDate(s.date)}</div>
                {s.location && <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>{s.location}</div>}
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}><b style={{ color: "var(--gold)" }}>{mean}</b> moy.</span>
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}><b style={{ color: "var(--green)" }}>{best}</b> best</span>
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>{scores.length} partie{scores.length > 1 ? "s" : ""}</span>
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
