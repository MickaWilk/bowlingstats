import { useState } from "react";
import { supabase } from "../lib/supabase";

const S = {
  wrap: { padding: "16px 14px", fontFamily: "'Courier New',monospace", color: "#e0e0e0" },
  title: { fontSize: 11, fontWeight: 700, color: "#e94560", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 },
  label: { fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, display: "block" },
  input: { width: "100%", padding: "11px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#eee", fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "'Courier New',monospace", marginBottom: 12 },
  scores: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  scoreInput: { width: 52, padding: "10px 6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#f0c040", fontSize: 15, fontWeight: 700, outline: "none", textAlign: "center", fontFamily: "inherit" },
  addBtn: { width: 52, height: 42, background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 8, color: "#555", fontSize: 20, cursor: "pointer" },
  removeBtn: { position: "absolute", top: -6, right: -6, width: 16, height: 16, borderRadius: "50%", background: "#e94560", border: "none", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 },
  submitBtn: { width: "100%", padding: 14, background: "#e94560", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 1 },
  summary: { display: "flex", gap: 8, marginBottom: 14 },
  stat: { flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 10px", textAlign: "center" },
  statVal: { fontSize: 18, fontWeight: 900, color: "#f0c040" },
  statLabel: { fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1 },
  err: { fontSize: 12, color: "#f87171", marginBottom: 10 },
  ok: { fontSize: 12, color: "#4ade80", marginBottom: 10 },
};

function avg(scores) {
  if (!scores.length) return null;
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
}

export default function SessionForm({ userId, onSaved }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [scores, setScores] = useState([""]);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(false);

  const valid = scores.filter(s => s !== "" && !isNaN(+s) && +s >= 0 && +s <= 300);

  function addScore() { setScores(s => [...s, ""]); }
  function removeScore(i) { setScores(s => s.filter((_, idx) => idx !== i)); }
  function updateScore(i, val) {
    setScores(s => s.map((v, idx) => idx === i ? val : v));
  }

  async function submit(e) {
    e.preventDefault();
    if (!valid.length) { setErr("Saisis au moins un score valide (0–300)."); return; }
    setErr(null);
    setLoading(true);

    const { error } = await supabase.from("sessions").insert({
      user_id: userId,
      date,
      scores: valid.map(Number),
      location: location.trim() || null,
    });

    setLoading(false);
    if (error) { setErr(error.message); return; }
    setOk(true);
    setScores([""]);
    setLocation("");
    setDate(today);
    setTimeout(() => { setOk(false); onSaved?.(); }, 1500);
  }

  return (
    <div style={S.wrap}>
      <div style={S.title}>✚ Nouvelle session</div>

      <form onSubmit={submit}>
        {err && <div style={S.err}>{err}</div>}
        {ok && <div style={S.ok}>Session enregistrée ✓</div>}

        <label style={S.label}>Date</label>
        <input style={S.input} type="date" value={date} onChange={e => setDate(e.target.value)} />

        <label style={S.label}>Salle (optionnel)</label>
        <input style={S.input} type="text" placeholder="ex : Bowling de Bordeaux" value={location} onChange={e => setLocation(e.target.value)} />

        <label style={S.label}>Scores des parties</label>
        <div style={S.scores}>
          {scores.map((s, i) => (
            <div key={i} style={{ position: "relative" }}>
              <input
                style={S.scoreInput}
                type="number" min="0" max="300"
                placeholder="—"
                value={s}
                onChange={e => updateScore(i, e.target.value)}
                inputMode="numeric"
              />
              {scores.length > 1 && (
                <button type="button" style={S.removeBtn} onClick={() => removeScore(i)}>×</button>
              )}
            </div>
          ))}
          <button type="button" style={S.addBtn} onClick={addScore}>+</button>
        </div>

        {valid.length > 0 && (
          <div style={S.summary}>
            <div style={S.stat}>
              <div style={S.statVal}>{valid.length}</div>
              <div style={S.statLabel}>Parties</div>
            </div>
            <div style={S.stat}>
              <div style={S.statVal}>{avg(valid.map(Number))}</div>
              <div style={S.statLabel}>Moyenne</div>
            </div>
            <div style={S.stat}>
              <div style={{ ...S.statVal, color: "#4ade80" }}>{Math.max(...valid.map(Number))}</div>
              <div style={S.statLabel}>Meilleur</div>
            </div>
          </div>
        )}

        <button style={S.submitBtn} type="submit" disabled={loading || !valid.length}>
          {loading ? "Enregistrement…" : "Enregistrer la session"}
        </button>
      </form>
    </div>
  );
}
