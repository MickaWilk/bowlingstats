/**
 * FrameInput — saisie frame par frame pour une partie de bowling
 *
 * Props:
 *   gameIndex   : number  — index de la partie (pour l'affichage)
 *   frames      : array   — état frames de cette partie (10 frames)
 *   onChange    : fn(frames, totalScore) — callback quand les frames changent
 *
 * Format frames : tableau de 10 éléments
 *   frames[i] = [] | [r1] | [r1, r2] | frame 10 : [r1, r2?, r3?]
 *   valeurs : 0–10, "X" (strike), "/" (spare), "G" (gutter=0)
 */

import { useState } from "react";

// ─── Logique bowling ─────────────────────────────────────────────────────────

function rollValue(val, pinsBefore = 0) {
  if (val === "X") return 10;
  if (val === "/") return 10 - pinsBefore;
  if (val === "G") return 0;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

function frameScore(frame, idx, allFrames) {
  if (!frame || frame.length === 0) return null;

  const r1 = rollValue(frame[0]);
  if (r1 === null) return null;

  // Frame 10 — pas de bonus, juste la somme des lancers
  if (idx === 9) {
    let total = 0;
    for (const roll of frame) {
      const v = rollValue(roll, roll === "/" ? rollValue(frame[frame.indexOf(roll) - 1]) : 0);
      if (v === null) return null;
      total += v;
    }
    return total;
  }

  // Strike
  if (r1 === 10) {
    // chercher les 2 prochains lancers
    const next = getNextRolls(idx, allFrames, 2);
    if (next.length < 2) return null;
    return 10 + next[0] + next[1];
  }

  const r2raw = frame[1];
  if (r2raw === undefined) return null;
  const r2 = rollValue(r2raw, r1);
  if (r2 === null) return null;

  // Spare
  if (r1 + r2 === 10) {
    const next = getNextRolls(idx, allFrames, 1);
    if (next.length < 1) return null;
    return 10 + next[0];
  }

  return r1 + r2;
}

function getNextRolls(frameIdx, allFrames, count) {
  const rolls = [];
  for (let f = frameIdx + 1; f < allFrames.length && rolls.length < count; f++) {
    const fr = allFrames[f];
    if (!fr) continue;
    for (const roll of fr) {
      const v = rollValue(roll, roll === "/" && fr.indexOf(roll) > 0 ? rollValue(fr[fr.indexOf(roll) - 1]) : 0);
      if (v !== null) rolls.push(v);
      if (rolls.length >= count) break;
    }
  }
  return rolls;
}

function calcTotal(allFrames) {
  let total = 0;
  for (let i = 0; i < 10; i++) {
    const s = frameScore(allFrames[i] || [], i, allFrames);
    if (s === null) return null; // incomplet
    total += s;
  }
  return total;
}

function calcRunningTotals(allFrames) {
  const totals = [];
  let running = 0;
  for (let i = 0; i < 10; i++) {
    const s = frameScore(allFrames[i] || [], i, allFrames);
    if (s === null) { totals.push(null); }
    else { running += s; totals.push(running); }
  }
  return totals;
}

// ─── État initial ─────────────────────────────────────────────────────────────

export function emptyFrames() {
  return Array(10).fill(null).map(() => []);
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function FrameInput({ gameIndex, frames, onChange }) {
  // activeFrame : index de la frame en cours de saisie
  const [activeFrame, setActiveFrame] = useState(0);

  const runningTotals = calcRunningTotals(frames);
  const total = calcTotal(frames);

  // ─── Logique de saisie par frame ──────────────────────────────────────────

  function handleRoll(frameIdx, value) {
    const newFrames = frames.map(f => [...f]);
    const frame = newFrames[frameIdx];
    const isLast = frameIdx === 9;

    if (!isLast) {
      if (frame.length === 0) {
        // Premier lancer
        if (value === "X") {
          // Strike → frame terminée
          newFrames[frameIdx] = ["X"];
          setActiveFrame(Math.min(9, frameIdx + 1));
        } else {
          newFrames[frameIdx] = [value];
        }
      } else if (frame.length === 1) {
        // Deuxième lancer
        const r1 = rollValue(frame[0]);
        const r2 = rollValue(value, r1);
        // Valider que r1 + r2 <= 10
        if (r2 !== null && r1 + r2 <= 10) {
          newFrames[frameIdx] = [...frame, value];
          setActiveFrame(Math.min(9, frameIdx + 1));
        }
      }
    } else {
      // Frame 10 — jusqu'à 3 lancers
      if (frame.length === 0) {
        newFrames[9] = [value];
      } else if (frame.length === 1) {
        const r1 = rollValue(frame[0]);
        if (frame[0] === "X") {
          // Strike → 2e lancer libre
          newFrames[9] = [...frame, value];
        } else {
          const r2 = rollValue(value, r1);
          if (r2 !== null && r1 + r2 <= 10) {
            newFrames[9] = [...frame, value];
          }
        }
      } else if (frame.length === 2) {
        const r1 = rollValue(frame[0]);
        const r2 = rollValue(frame[1], r1);
        const isSpare = frame[0] !== "X" && r1 + r2 === 10;
        const isStrike1 = frame[0] === "X";
        const isStrike2 = frame[1] === "X";
        // 3e lancer si strike ou spare dans les 2 premiers
        if (isSpare || isStrike1 || isStrike2) {
          newFrames[9] = [...frame, value];
        }
      }
    }

    const newTotal = calcTotal(newFrames);
    onChange(newFrames, newTotal);
  }

  function clearFrame(frameIdx) {
    const newFrames = frames.map(f => [...f]);
    newFrames[frameIdx] = [];
    setActiveFrame(frameIdx);
    onChange(newFrames, calcTotal(newFrames));
  }

  // ─── Boutons disponibles pour une frame ───────────────────────────────────

  function getAvailableButtons(frameIdx) {
    const frame = frames[frameIdx] || [];
    const isLast = frameIdx === 9;

    if (!isLast) {
      if (frame.length === 0) {
        return ["X", "G", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
      } else if (frame.length === 1) {
        const r1 = rollValue(frame[0]);
        const remaining = 10 - r1;
        const btns = ["G"];
        if (remaining === 10) btns.push("/");
        else btns.push("/");
        for (let i = 1; i < remaining; i++) btns.push(String(i));
        return btns;
      }
      return [];
    } else {
      // Frame 10
      if (frame.length === 0) {
        return ["X", "G", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
      } else if (frame.length === 1) {
        if (frame[0] === "X") {
          return ["X", "G", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
        }
        const r1 = rollValue(frame[0]);
        const btns = ["G", "/"];
        for (let i = 1; i < 10 - r1; i++) btns.push(String(i));
        return btns;
      } else if (frame.length === 2) {
        const r1 = rollValue(frame[0]);
        const r2raw = frame[1];
        const r2 = rollValue(r2raw, r1);
        const isSpare10 = frame[0] !== "X" && r1 + r2 === 10;
        const isStrike1 = frame[0] === "X";
        const isStrike2 = frame[1] === "X";
        if (isSpare10 || isStrike1 || isStrike2) {
          if (isStrike2 || (isStrike1 && r2 === 10)) {
            return ["X", "G", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
          }
          const pinsLeft = isStrike1 ? 10 - r2 : 10;
          const btns = ["G"];
          if (pinsLeft === 10) btns.push("X");
          else btns.push("/");
          for (let i = 1; i < pinsLeft; i++) btns.push(String(i));
          return btns;
        }
        return [];
      }
      return [];
    }
  }

  function isFrameComplete(frameIdx) {
    const frame = frames[frameIdx] || [];
    const isLast = frameIdx === 9;
    if (!isLast) {
      return frame.length === 2 || frame[0] === "X";
    }
    // Frame 10 : complète si 3 lancers OU si pas de bonus (2 lancers, pas de strike/spare)
    if (frame.length < 2) return false;
    const r1 = rollValue(frame[0]);
    const r2 = rollValue(frame[1], r1);
    const hasBonus = frame[0] === "X" || r1 + r2 === 10;
    return hasBonus ? frame.length === 3 : frame.length === 2;
  }

  function displayRoll(roll, prevRoll = null) {
    if (roll === "X") return "X";
    if (roll === "/") return "/";
    if (roll === "G") return "G";
    return roll;
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
        Partie {gameIndex + 1}
        {total !== null && (
          <span style={{ marginLeft: 8, color: "var(--gold)", fontWeight: 800, fontSize: 13 }}>
            → {total}
          </span>
        )}
      </div>

      {/* Grille des 10 frames */}
      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ display: "flex", gap: 4, minWidth: "max-content" }}>
          {Array(10).fill(null).map((_, fi) => {
            const frame = frames[fi] || [];
            const isActive = fi === activeFrame;
            const isComplete = isFrameComplete(fi);
            const isLast = fi === 9;
            const score = runningTotals[fi];

            return (
              <div
                key={fi}
                onClick={() => setActiveFrame(fi)}
                style={{
                  width: isLast ? 64 : 52,
                  flexShrink: 0,
                  cursor: "pointer",
                  borderRadius: "var(--radius-sm)",
                  border: isActive
                    ? "2px solid var(--primary)"
                    : isComplete
                    ? "2px solid var(--border-focus)"
                    : "2px solid var(--border)",
                  background: isActive ? "var(--primary-dim)" : "var(--surface)",
                  overflow: "hidden",
                  transition: "border-color var(--transition)",
                }}
              >
                {/* Numéro frame */}
                <div style={{
                  fontSize: 9,
                  color: isActive ? "var(--primary)" : "var(--text-3)",
                  textAlign: "center",
                  padding: "3px 0 1px",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--border)",
                }}>
                  {fi + 1}
                </div>

                {/* Lancers */}
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  padding: "4px 4px 2px",
                  minHeight: 28,
                }}>
                  {isLast ? (
                    // Frame 10 : jusqu'à 3 cases
                    [0, 1, 2].map(ri => (
                      <div key={ri} style={rollBoxStyle(frame[ri] !== undefined)}>
                        {frame[ri] !== undefined ? displayRoll(frame[ri], ri > 0 ? frame[ri - 1] : null) : "·"}
                      </div>
                    ))
                  ) : (
                    // Frames 1–9
                    frame[0] === "X" ? (
                      <>
                        <div style={rollBoxStyle(false)}>·</div>
                        <div style={{ ...rollBoxStyle(true), color: "var(--gold)", fontWeight: 800 }}>X</div>
                      </>
                    ) : (
                      [0, 1].map(ri => (
                        <div key={ri} style={rollBoxStyle(frame[ri] !== undefined)}>
                          {frame[ri] !== undefined ? displayRoll(frame[ri], ri === 1 ? frame[0] : null) : "·"}
                        </div>
                      ))
                    )
                  )}
                </div>

                {/* Score cumulé */}
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: score !== null ? "var(--text)" : "var(--text-3)",
                  textAlign: "center",
                  padding: "2px 0 4px",
                  borderTop: "1px solid var(--border)",
                }}>
                  {score !== null ? score : "–"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pad de saisie pour la frame active */}
      {!isFrameComplete(activeFrame) && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 6, textAlign: "center" }}>
            Frame {activeFrame + 1} — lancer {(frames[activeFrame] || []).length + 1}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {getAvailableButtons(activeFrame).map(btn => (
              <button
                key={btn}
                type="button"
                onClick={() => handleRoll(activeFrame, btn)}
                style={padBtnStyle(btn)}
              >
                {btn}
              </button>
            ))}
          </div>
          {(frames[activeFrame] || []).length > 0 && (
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <button
                type="button"
                onClick={() => clearFrame(activeFrame)}
                style={{ fontSize: 11, color: "var(--text-3)", background: "none", border: "none", textDecoration: "underline" }}
              >
                Effacer frame {activeFrame + 1}
              </button>
            </div>
          )}
        </div>
      )}

      {isFrameComplete(activeFrame) && activeFrame < 9 && (
        <div style={{ marginTop: 8, textAlign: "center" }}>
          <button
            type="button"
            onClick={() => clearFrame(activeFrame)}
            style={{ fontSize: 11, color: "var(--text-3)", background: "none", border: "none", textDecoration: "underline", marginRight: 12 }}
          >
            Effacer frame {activeFrame + 1}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Styles helpers ───────────────────────────────────────────────────────────

function rollBoxStyle(filled) {
  return {
    width: 18,
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: filled ? 700 : 400,
    color: filled ? "var(--text)" : "var(--text-3)",
    background: filled ? "var(--surface-2)" : "transparent",
    borderRadius: 3,
  };
}

function padBtnStyle(btn) {
  const isStrike = btn === "X";
  const isSpare = btn === "/";
  const isGutter = btn === "G";
  return {
    width: 44,
    height: 44,
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: isStrike
      ? "var(--gold-dim)"
      : isSpare
      ? "var(--green-dim)"
      : isGutter
      ? "var(--surface-2)"
      : "var(--surface)",
    color: isStrike
      ? "var(--gold)"
      : isSpare
      ? "var(--green)"
      : "var(--text)",
    fontSize: 16,
    fontWeight: 700,
    transition: "background var(--transition), transform var(--transition)",
  };
}
