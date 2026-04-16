import { useState } from "react";
import { supabase } from "../lib/supabase";

function avg(arr) {
  if (!arr.length) return null;
  return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
}

export default function SessionForm({ userId, onSaved }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [location, setLocation] = useState("");
  const [scores, setScores] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(null);

  const valid = scores.map(Number).filter(n => !isNaN(n) && n >= 0 && n <= 300 && scores[scores.indexOf(String(n))] !== "");
  const validScores = scores.filter(s => s !== "" && !isNaN(+s) && +s >= 0 && +s <= 300).map(Number);

  function addGame() { setScores(s => [...s, ""]); }
  function removeGame(i) { setScores(s => s.filter((_, idx) => idx !== i)); }
  function updateScore(i, val) { setScores(s => s.map((v, idx) => idx === i ? val : v)); }

  async function submit(e) {
    e.preventDefault();
    if (!validScores.length) { setErr("Saisis au moins un score valide."); return; }
    setErr(null); setLoading(true);
    const { error } = await supabase.from("sessions").insert({
      user_id: userId,
      date,
      scores: validScores,
      location: location.trim() || null,
    });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setOk(true);
    setScores([""]); setLocation(""); setDate(today);
    setTimeout(() => { setOk(false); onSaved?.(); }, 1200);
  }

  return (
    <div style={{ padding: "20px 16px 32px" }}>

      <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 20 }}>
        Nouvelle session
      </h2>

      <form onSubmit={submit}>

        {/* Date + Lieu */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>Date</label>
            <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Salle</label>
            <input style={inputStyle} type="text" placeholder="optionnel" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
        </div>

        {/* Scores */}
        <label style={{ ...labelStyle, marginBottom: 10, display: "block" }}>Parties</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {scores.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "var(--text-3)", width: 20, textAlign: "right", flexShrink: 0 }}>#{i + 1}</span>
              <input
                style={{ ...inputStyle, flex: 1, marginBottom: 0, fontSize: 20, fontWeight: 700, textAlign: "center", color: s && !isNaN(+s) ? "var(--gold)" : "var(--text)" }}
                type="number" min="0" max="300" inputMode="numeric"
                placeholder="—"
                value={s}
                onChange={e => updateScore(i, e.target.value)}
              />
              {scores.length > 1 && (
                <button type="button" onClick={() => removeGame(i)} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" onClick={addGame} style={{ width: "100%", padding: "10px", background: "var(--surface-2)", border: "1px dashed var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-2)", fontSize: 13, marginBottom: 16 }}>
          + Ajouter une partie
        </button>

        {/* Résumé */}
        {validScores.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
            <StatChip label="Parties" value={validScores.length} color="var(--text)" />
            <StatChip label="Moyenne" value={avg(validScores)} color="var(--gold)" />
            <StatChip label="Meilleur" value={Math.max(...validScores)} color="var(--green)" />
          </div>
        )}

        {err && <p style={{ fontSize: 12, color: "var(--red)", marginBottom: 10 }}>{err}</p>}
        {ok  && <p style={{ fontSize: 12, color: "var(--green)", marginBottom: 10 }}>Session enregistrée ✓</p>}

        <button type="submit" disabled={loading || !validScores.length} style={{
          width: "100%", padding: 15, background: validScores.length ? "var(--primary)" : "var(--surface-2)",
          border: "none", borderRadius: "var(--radius-md)", color: validScores.length ? "#fff" : "var(--text-3)",
          fontSize: 15, fontWeight: 700, letterSpacing: 0.3, transition: "background var(--transition)"
        }}>
          {loading ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}

function StatChip({ label, value, color }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 8px", textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{label}</div>
    </div>
  );
}

const labelStyle = { fontSize: 11, fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, display: "block" };
const inputStyle = { width: "100%", padding: "11px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text)", fontSize: 14, outline: "none", marginBottom: 0 };
