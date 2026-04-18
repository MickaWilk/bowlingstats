import { useState, useMemo } from "react";
import {
  ComposedChart, Line, Area, Bar, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Brush, Legend
} from "recharts";

const sdColor = (sd) => sd === null ? "var(--text-3)" : sd < 15 ? "var(--green)" : sd < 25 ? "var(--gold)" : "var(--red)";

function computeStats(session) {
  const sc = (session.scores || []).filter(Number.isFinite);
  if (!sc.length) return null;
  const n = sc.length;
  const mean = sc.reduce((a, b) => a + b, 0) / n;
  const sd = n > 1 ? Math.sqrt(sc.reduce((v, x) => v + (x - mean) ** 2, 0) / n) : null;
  return {
    date: session.date.slice(5).split("-").reverse().join("/"),
    avg: +mean.toFixed(1),
    sd: sd !== null ? +sd.toFixed(1) : null,
    min: Math.min(...sc),
    max: Math.max(...sc),
    n,
  };
}

const PerfTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 16px", fontSize: 12, color: "var(--text)", boxShadow: "var(--shadow)", minWidth: 160 }}>
      <div style={{ fontWeight: 700, color: "var(--primary)", marginBottom: 8 }}>🎳 {d.date}</div>
      <Row label="Parties" value={d.n} color="var(--text)" />
      <Row label="Moyenne" value={d.avg} color="var(--gold)" />
      {d.sd !== null && <Row label="σ" value={d.sd} color={sdColor(d.sd)} />}
      <Row label="Min / Max" value={`${d.min} / ${d.max}`} color="var(--blue)" />
      {d.trend && <Row label="Tendance" value={d.trend} color="var(--purple)" />}
    </div>
  );
};

const RegTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 16px", fontSize: 12, color: "var(--text)", boxShadow: "var(--shadow)" }}>
      <div style={{ fontWeight: 700, color: "var(--purple)", marginBottom: 8 }}>📊 {d.date}</div>
      {d.sd !== null ? <Row label="σ" value={d.sd} color={sdColor(d.sd)} /> : <span style={{ color: "var(--text-3)" }}>1 seule partie</span>}
      {d.rSD != null && <Row label="Tendance σ" value={d.rSD} color="var(--purple)" />}
    </div>
  );
};

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
      <span style={{ color: "var(--text-2)" }}>{label}</span>
      <span style={{ fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function StatCard({ icon, value, label, color, sub }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 8px" }}>
      <div style={{ fontSize: 14, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--text-2)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function StatChip({ icon, value, label, color }) {
  return (
    <div style={{
      display: "inline-flex", flexDirection: "column", alignItems: "center",
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)", padding: "6px 12px",
      minWidth: 72, flexShrink: 0,
    }}>
      <span style={{ fontSize: 11, marginBottom: 1 }}>{icon}</span>
      <span style={{ fontSize: 17, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2, whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

const INFO_CONTENT = [
  { title: "Moyenne", color: "var(--gold)", text: "Moyenne de tous les scores de la session. Elle monte = tu progresses globalement." },
  { title: "σ (écart-type)", color: "var(--red)", text: "Mesure la dispersion de tes scores dans une session. σ < 15 = très régulier · 15–25 = correct · > 25 = grosse dispersion." },
  { title: "Tendance (ligne violette)", color: "var(--purple)", text: "Moyenne mobile sur les 5 dernières sessions. Filtre le bruit et montre la vraie direction." },
  { title: "Zone bleue", color: "var(--blue)", text: "Amplitude min–max de chaque session. L'écart entre tes scores extrêmes." },
  { title: "Points colorés", color: "var(--text)", text: "Couleur = régularité de la session. 🟢 σ<15 · 🟡 15–25 · 🔴 >25 · ⚫ 1 seule partie. Taille grande = ≥ 8 parties." },
  { title: "Progression (fenêtre N)", color: "var(--green)", text: "Compare la moyenne des N dernières sessions aux N précédentes. Positif = tu progresses sur cette période." },
];

export default function Dashboard({ sessions }) {
  const [N, setN] = useState(5);
  const [showInfo, setShowInfo] = useState(false);
  const [brushRange, setBrushRange] = useState(null);
  const [view, setView] = useState("both");

  const data = useMemo(() =>
    [...sessions].sort((a, b) => a.date.localeCompare(b.date)).map(computeStats).filter(Boolean)
  , [sessions]);

  const withTrend = useMemo(() => data.map((d, i) => {
    const win = data.slice(Math.max(0, i - 4), i + 1);
    const trend = +(win.reduce((s, x) => s + x.avg, 0) / win.length).toFixed(1);
    const sds = win.filter(x => x.sd !== null).map(x => x.sd);
    const rSD = sds.length ? +(sds.reduce((a, b) => a + b, 0) / sds.length).toFixed(1) : null;
    return { ...d, trend, rSD, idx: i };
  }), [data]);

  const range = brushRange || { start: 0, end: withTrend.length - 1 };
  const visible = withTrend.slice(range.start, range.end + 1);

  const allScores = sessions.flatMap(s => (s.scores || []).filter(Number.isFinite));
  const allTimeAvg = allScores.length ? +(allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : "—";
  const allTimeMax = allScores.length ? Math.max(...allScores) : "—";

  const effectiveN = Math.min(N, visible.length);
  const recent = visible.slice(-effectiveN);
  const before = visible.slice(-effectiveN * 2, -effectiveN);
  const recentAvg = recent.length ? +(recent.reduce((s, d) => s + d.avg, 0) / recent.length).toFixed(1) : null;
  const beforeAvg = before.length ? +(before.reduce((s, d) => s + d.avg, 0) / before.length).toFixed(1) : null;
  const prog = recentAvg !== null && beforeAvg !== null ? +((recentAvg - beforeAvg)).toFixed(1) : null;

  const visScores = sessions.slice(range.start, range.end + 1).flatMap(s => (s.scores || []).filter(Number.isFinite));
  const periodAvg = visScores.length ? +(visScores.reduce((a, b) => a + b, 0) / visScores.length).toFixed(1) : "—";
  const periodMax = visScores.length ? Math.max(...visScores) : "—";
  const recentSDs = recent.filter(d => d.sd !== null).map(d => d.sd);
  const recentAvgSD = recentSDs.length ? +(recentSDs.reduce((a, b) => a + b, 0) / recentSDs.length).toFixed(1) : "—";

  const yMin = visible.length ? Math.floor((Math.min(...visible.map(d => d.min)) - 10) / 10) * 10 : 80;
  const yMax = visible.length ? Math.ceil((Math.max(...visible.map(d => d.max)) + 15) / 10) * 10 : 260;

  const brushProps = {
    dataKey: "idx", startIndex: range.start, endIndex: range.end,
    onChange: ({ startIndex, endIndex }) => {
      if (startIndex != null && endIndex != null) setBrushRange({ start: startIndex, end: endIndex });
    },
    height: 20, stroke: "var(--border)", fill: "var(--surface-2)", travellerWidth: 10,
  };

  if (!sessions.length) return (
    <div style={{ padding: "60px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎳</div>
      <p style={{ color: "var(--text-2)" }}>Aucune session enregistrée.</p>
    </div>
  );

  return (
    <div style={{ padding: "12px 10px 24px" }}>

      {/* All-time — bande horizontale scrollable */}
      <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        Historique · {sessions.length} sessions · {allScores.length} parties
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", WebkitOverflowScrolling: "touch", marginBottom: 12, paddingBottom: 2 }}>
        <StatChip icon="🏆" value={allTimeMax} label="Record" color="var(--green)" />
        <StatChip icon="🎯" value={allTimeAvg} label="Moy. totale" color="var(--gold)" />
        <StatChip icon="📊" value={(() => { const sds = withTrend.filter(d => d.sd !== null); return sds.length ? +(sds.reduce((a, b) => a + b.sd, 0) / sds.length).toFixed(1) : "—"; })()} label="σ all-time" color="var(--red)" />
        <StatChip icon="🎳" value={sessions.length} label="Sessions" color="var(--text)" />
      </div>

      {/* View toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {[["both", "Tout"], ["perf", "Performance"], ["reg", "Régularité"]].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} style={{
            flex: 1, padding: "7px 4px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
            background: view === k ? "var(--primary)" : "var(--surface)", color: view === k ? "#fff" : "var(--text-2)",
            fontSize: 11, fontWeight: 700
          }}>{l}</button>
        ))}
        <button onClick={() => setShowInfo(true)} style={{ width: 34, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", fontSize: 14 }}>ℹ</button>
      </div>

      {/* Chart Performance */}
      {(view === "perf" || view === "both") && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "8px 0 4px", marginBottom: 8 }}>
          <div style={{ paddingLeft: 12, marginBottom: 6, fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: 1, textTransform: "uppercase" }}>📈 Performance · glisser pour zoomer</div>
          <ResponsiveContainer width="100%" height={Math.min(Math.round(window.innerHeight * 0.55), 300)}>
            <ComposedChart data={withTrend} margin={{ left: 0, right: 14, top: 4, bottom: 48 }}>
              <defs>
                <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F0C040" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#F0C040" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="idx" type="number" domain={[range.start, range.end]}
                tickFormatter={i => withTrend[i]?.date.slice(0, 5) ?? ""}
                tick={{ fill: "var(--text-3)", fontSize: 9 }} angle={-45} textAnchor="end" height={52} stroke="var(--border)" />
              <YAxis domain={[yMin, yMax]} tick={{ fill: "var(--text-2)", fontSize: 10 }} width={36} stroke="var(--border)" tickLine={false} />
              <Tooltip content={<PerfTooltip />} />
              <ReferenceLine y={+allTimeAvg} stroke="var(--gold)" strokeOpacity={0.2} strokeDasharray="6 4"
                label={{ value: `moy. ${allTimeAvg}`, position: "insideRight", fill: "var(--gold)", fontSize: 9, fillOpacity: 0.6 }} />
              <Area type="monotone" dataKey="max" stroke="none" fill="rgba(96,165,250,0.06)" />
              <Area type="monotone" dataKey="min" stroke="none" fill="var(--bg)" fillOpacity={1} />
              <Area type="monotone" dataKey="avg" stroke="none" fill="url(#gArea)" />
              <Line type="monotone" dataKey="min" stroke="var(--blue)" strokeWidth={1} dot={false} strokeDasharray="3 2" name="Min" />
              <Line type="monotone" dataKey="max" stroke="var(--green)" strokeWidth={1} dot={false} strokeDasharray="3 2" name="Max" />
              <Line type="monotone" dataKey="trend" stroke="var(--purple)" strokeWidth={2} dot={false} strokeDasharray="6 3" name="Tendance" />
              <Line type="monotone" dataKey="avg" stroke="var(--gold)" strokeWidth={2} name="Moy."
                dot={({ cx, cy, payload }) => (
                  <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={payload.n >= 8 ? 5 : 3.5}
                    fill={payload.sd === null ? "var(--text-3)" : sdColor(payload.sd)}
                    stroke="var(--bg)" strokeWidth={1.5} />
                )} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 10, paddingBottom: 4 }} />
              <Brush {...brushProps} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart Régularité */}
      {(view === "reg" || view === "both") && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "8px 0 4px", marginBottom: 8 }}>
          <div style={{ paddingLeft: 12, marginBottom: 6, fontSize: 11, fontWeight: 700, color: "var(--purple)", letterSpacing: 1, textTransform: "uppercase" }}>📊 Régularité σ</div>
          <ResponsiveContainer width="100%" height={Math.min(Math.round(window.innerHeight * 0.35), 200)}>
            <ComposedChart data={withTrend} margin={{ left: 0, right: 14, top: 4, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="idx" type="number" domain={[range.start, range.end]}
                tickFormatter={i => withTrend[i]?.date.slice(0, 5) ?? ""}
                tick={{ fill: "var(--text-3)", fontSize: 9 }} angle={-45} textAnchor="end" height={52} stroke="var(--border)" />
              <YAxis domain={[0, 50]} tick={{ fill: "var(--text-2)", fontSize: 10 }} width={36} stroke="var(--border)" tickLine={false} />
              <Tooltip content={<RegTooltip />} />
              <ReferenceLine y={15} stroke="var(--green)" strokeOpacity={0.3} strokeDasharray="4 4" label={{ value: "σ=15", position: "insideRight", fill: "var(--green)", fontSize: 9, fillOpacity: 0.7 }} />
              <ReferenceLine y={25} stroke="var(--gold)" strokeOpacity={0.3} strokeDasharray="4 4" label={{ value: "σ=25", position: "insideRight", fill: "var(--gold)", fontSize: 9, fillOpacity: 0.7 }} />
              <Bar dataKey="sd" name="σ" radius={[3, 3, 0, 0]} maxBarSize={12}>
                {withTrend.map((d, i) => <Cell key={i} fill={sdColor(d.sd)} fillOpacity={0.85} />)}
              </Bar>
              <Line type="monotone" dataKey="rSD" stroke="var(--purple)" strokeWidth={2} dot={false} strokeDasharray="6 3" name="Tendance σ" />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 10, paddingBottom: 4 }} />
              <Brush {...brushProps} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats dynamiques */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "10px 10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1 }}>
            Sélection · {visible.length} sessions
          </span>
          {brushRange && (
            <button onClick={() => setBrushRange(null)} style={{ fontSize: 10, color: "var(--primary)", background: "none", border: "none", cursor: "pointer" }}>
              Reset
            </button>
          )}
        </div>

        {/* Bande horizontale scrollable */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", WebkitOverflowScrolling: "touch", marginBottom: 10, paddingBottom: 2 }}>
          <StatChip icon="🎯" value={periodAvg} label="Moy. période" color="var(--gold)" />
          <StatChip icon="🏅" value={periodMax} label="Meilleur" color="var(--green)" />
          <StatChip icon="📊" value={recentAvgSD} label={`σ (${effectiveN})`} color="var(--red)" />
          <StatChip
            icon={prog != null ? (prog >= 0 ? "⬆️" : "⬇️") : "—"}
            value={prog != null ? (prog >= 0 ? `+${prog}` : `${prog}`) : "—"}
            label="Progression"
            color={prog != null ? (prog >= 0 ? "var(--green)" : "var(--red)") : "var(--text-3)"}
          />
        </div>

        {/* Fenêtre N */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1 }}>N =</span>
          {[1, 2, 3, 5, 7, 10, 15, 20].map(n => (
            <button key={n} onClick={() => setN(n)} style={{
              padding: "4px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
              background: N === n ? "var(--primary)" : "var(--surface-2)",
              color: N === n ? "#fff" : "var(--text-2)", fontSize: 11, fontWeight: 700
            }}>{n}</button>
          ))}
        </div>
      </div>

      {/* Modal info */}
      {showInfo && (
        <div onClick={() => setShowInfo(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0", padding: "20px 16px 32px", width: "100%", maxHeight: "70vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>Guide des stats</span>
              <button onClick={() => setShowInfo(false)} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-2)", fontSize: 16 }}>×</button>
            </div>
            {INFO_CONTENT.map(({ title, color, text }) => (
              <div key={title} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
