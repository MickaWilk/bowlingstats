import { useState } from "react";
import { supabase } from "../lib/supabase";
import FrameInput, { emptyFrames } from "./FrameInput";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avg(arr) {
  if (!arr.length) return null;
  return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
}

function buildGameState() {
  return { frames: emptyFrames(), total: null };
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function SessionForm({ userId, onSaved }) {
  const today = new Date().toISOString().slice(0, 10);

  // — Niveau 1 : toujours visible
  const [date, setDate] = useState(today);
  const [location, setLocation] = useState("");
  const [scores, setScores] = useState([""]);

  // — Niveau 2 : mode avancé
  const [advanced, setAdvanced] = useState(false);
  const [games, setGames] = useState([buildGameState()]); // un par partie
  const [fatigue, setFatigue] = useState(0);     // 0 = non défini, 1–5
  const [lane, setLane] = useState(null);         // "sèche" | "huilée" | "inconnue"
  const [noteText, setNoteText] = useState("");

  // — État submit
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(null);

  // ─── Scores niveau 1 ────────────────────────────────────────────────────────

  const validScores = scores
    .filter(s => s !== "" && !isNaN(+s) && +s >= 0 && +s <= 300)
    .map(Number);

  function addGame() {
    setScores(s => [...s, ""]);
    setGames(g => [...g, buildGameState()]);
  }

  function removeGame(i) {
    setScores(s => s.filter((_, idx) => idx !== i));
    setGames(g => g.filter((_, idx) => idx !== i));
  }

  function updateScore(i, val) {
    setScores(s => s.map((v, idx) => (idx === i ? val : v)));
  }

  // ─── Frames mode avancé ──────────────────────────────────────────────────────

  function handleFrameChange(gameIdx, newFrames, newTotal) {
    setGames(g =>
      g.map((game, i) =>
        i === gameIdx ? { frames: newFrames, total: newTotal } : game
      )
    );
    // Sync automatique vers score simple si total calculé
    if (newTotal !== null) {
      setScores(s => s.map((v, i) => (i === gameIdx ? String(newTotal) : v)));
    }
  }

  // ─── Données finales pour la DB ──────────────────────────────────────────────

  function buildPayload() {
    // Scores finaux : priorité au score calculé depuis frames (si avancé)
    let finalScores;
    if (advanced) {
      finalScores = games
        .map((g, i) => {
          if (g.total !== null) return g.total;
          const manual = Number(scores[i]);
          return !isNaN(manual) && manual >= 0 && manual <= 300 ? manual : null;
        })
        .filter(s => s !== null);
    } else {
      finalScores = validScores;
    }

    if (!finalScores.length) return null;

    // Frames JSONB
    let framesData = null;
    if (advanced) {
      const gamesWithFrames = games.filter(g => g.frames.some(f => f.length > 0));
      if (gamesWithFrames.length > 0) {
        framesData = games.map((g, i) => ({
          game: i + 1,
          frames: g.frames,
        }));
      }
    }

    // Context JSONB
    let contextData = null;
    if (advanced && (fatigue > 0 || lane !== null || noteText.trim())) {
      contextData = {
        ...(fatigue > 0 && { fatigue }),
        ...(lane !== null && { lane }),
        ...(noteText.trim() && { note: noteText.trim() }),
      };
    }

    return { scores: finalScores, frames: framesData, context: contextData };
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────

  async function submit(e) {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) { setErr("Saisis au moins un score valide."); return; }

    setErr(null);
    setLoading(true);
    const { error } = await supabase.from("sessions").insert({
      user_id: userId,
      date,
      scores: payload.scores,
      location: location.trim() || null,
      frames: payload.frames,
      context: payload.context,
    });
    setLoading(false);

    if (error) { setErr(error.message); return; }

    setOk(true);
    // Reset
    setScores([""]);
    setGames([buildGameState()]);
    setLocation("");
    setDate(today);
    setFatigue(0);
    setLane(null);
    setNoteText("");
    setAdvanced(false);
    setTimeout(() => { setOk(false); onSaved?.(); }, 1200);
  }

  // ─── Scores à afficher dans le résumé ────────────────────────────────────────

  const displayScores = advanced
    ? games
        .map((g, i) =>
          g.total !== null
            ? g.total
            : scores[i] !== "" && !isNaN(+scores[i])
            ? Number(scores[i])
            : null
        )
        .filter(s => s !== null)
    : validScores;

  const canSubmit = displayScores.length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "20px 16px 40px" }}>

      <h2 style={sectionTitleStyle}>Nouvelle session</h2>

      <form onSubmit={submit}>

        {/* ── Date + Lieu ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Date</label>
            <input
              style={inputStyle}
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Salle</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="optionnel"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>
        </div>

        {/* ── Parties ── */}
        <label style={{ ...labelStyle, marginBottom: 10, display: "block" }}>Parties</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {scores.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "var(--text-3)", width: 20, textAlign: "right", flexShrink: 0 }}>
                #{i + 1}
              </span>
              <input
                style={{
                  ...inputStyle,
                  flex: 1,
                  fontSize: 20,
                  fontWeight: 700,
                  textAlign: "center",
                  color:
                    advanced && games[i]?.total !== null
                      ? "var(--green)"
                      : s && !isNaN(+s)
                      ? "var(--gold)"
                      : "var(--text)",
                }}
                type="number"
                min="0"
                max="300"
                inputMode="numeric"
                placeholder="—"
                value={
                  advanced && games[i]?.total !== null
                    ? String(games[i].total)
                    : s
                }
                onChange={e => {
                  if (advanced && games[i]?.total !== null) return; // calculé depuis frames, lecture seule
                  updateScore(i, e.target.value);
                }}
                readOnly={advanced && games[i]?.total !== null}
              />
              {scores.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGame(i)}
                  style={removeGameBtnStyle}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" onClick={addGame} style={addGameBtnStyle}>
          + Ajouter une partie
        </button>

        {/* ── Résumé ── */}
        {displayScores.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16, marginTop: 4 }}>
            <StatChip label="Parties" value={displayScores.length} color="var(--text)" />
            <StatChip label="Moyenne" value={avg(displayScores)} color="var(--gold)" />
            <StatChip label="Meilleur" value={Math.max(...displayScores)} color="var(--green)" />
          </div>
        )}

        {/* ── Séparateur mode avancé ── */}
        <button
          type="button"
          onClick={() => setAdvanced(a => !a)}
          style={advancedToggleStyle}
        >
          <span style={{ flex: 1, textAlign: "left" }}>Mode avancé</span>
          <span style={{
            fontSize: 12,
            transition: "transform 0.2s",
            display: "inline-block",
            transform: advanced ? "rotate(180deg)" : "rotate(0deg)",
          }}>▾</span>
        </button>

        {/* ── Contenu mode avancé ── */}
        {advanced && (
          <div style={{ marginTop: 2, paddingTop: 16, borderTop: "1px solid var(--border)" }}>

            {/* Frames par partie */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ ...labelStyle, marginBottom: 12, display: "block" }}>
                Saisie frame par frame
              </label>
              {games.map((game, gi) => (
                <FrameInput
                  key={gi}
                  gameIndex={gi}
                  frames={game.frames}
                  onChange={(newFrames, total) => handleFrameChange(gi, newFrames, total)}
                />
              ))}
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginBottom: 16 }} />

            {/* Contexte — fatigue */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ ...labelStyle, marginBottom: 8, display: "block" }}>Fatigue</label>
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFatigue(f => f === n ? 0 : n)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      background: fatigue >= n ? "var(--primary-dim)" : "var(--surface)",
                      fontSize: 18,
                      transition: "background var(--transition)",
                    }}
                  >
                    {fatigue >= n ? "★" : "☆"}
                  </button>
                ))}
              </div>
            </div>

            {/* Contexte — conditions de piste */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ ...labelStyle, marginBottom: 8, display: "block" }}>Conditions de piste</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { value: "sèche", label: "Sèche" },
                  { value: "huilée", label: "Huilée" },
                  { value: "inconnue", label: "?" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLane(l => l === opt.value ? null : opt.value)}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: "var(--radius-sm)",
                      border: lane === opt.value
                        ? "2px solid var(--primary)"
                        : "1px solid var(--border)",
                      background: lane === opt.value ? "var(--primary-dim)" : "var(--surface)",
                      color: lane === opt.value ? "var(--primary)" : "var(--text-2)",
                      fontSize: 13,
                      fontWeight: lane === opt.value ? 700 : 400,
                      transition: "all var(--transition)",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note rapide */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 8, display: "block" }}>
                Ressenti / axe de travail
              </label>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Placement des pieds, élan, mental…"
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  lineHeight: 1.5,
                  fontSize: 13,
                }}
              />
            </div>
          </div>
        )}

        {/* ── Feedback + bouton submit ── */}
        {err && <p style={{ fontSize: 12, color: "var(--red)", marginBottom: 10, marginTop: 10 }}>{err}</p>}
        {ok  && <p style={{ fontSize: 12, color: "var(--green)", marginBottom: 10, marginTop: 10 }}>Session enregistrée ✓</p>}

        <button
          type="submit"
          disabled={loading || !canSubmit}
          style={{
            width: "100%",
            padding: 16,
            marginTop: 16,
            background: canSubmit ? "var(--primary)" : "var(--surface-2)",
            border: "none",
            borderRadius: "var(--radius-md)",
            color: canSubmit ? "#fff" : "var(--text-3)",
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 0.3,
            transition: "background var(--transition), transform var(--transition)",
            ...(canSubmit && !loading && {
              cursor: "pointer",
            }),
          }}
        >
          {loading ? "Enregistrement…" : ok ? "✓ Enregistré" : "Enregistrer"}
        </button>

      </form>
    </div>
  );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function StatChip({ label, value, color }) {
  return (
    <div style={{
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)",
      padding: "10px 8px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sectionTitleStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--text-2)",
  letterSpacing: 1,
  textTransform: "uppercase",
  marginBottom: 20,
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-2)",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 6,
  display: "block",
};

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text)",
  fontSize: 14,
  outline: "none",
  marginBottom: 0,
};

const removeGameBtnStyle = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  color: "var(--text-2)",
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const addGameBtnStyle = {
  width: "100%",
  padding: "10px",
  background: "var(--surface-2)",
  border: "1px dashed var(--border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-2)",
  fontSize: 13,
  marginBottom: 16,
};

const advancedToggleStyle = {
  width: "100%",
  padding: "12px 14px",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-2)",
  fontSize: 13,
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 0,
  letterSpacing: 0.2,
};
