import { useState, useMemo } from "react";
import {
  ComposedChart, Line, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

const sdColor = (sd) => sd === null ? "#888" : sd < 15 ? "#4ade80" : sd < 25 ? "#facc15" : "#f87171";

function computeStats(session) {
  const sc = (session.scores || []).filter(Number.isFinite);
  const n = sc.length;
  if (!n) return null;
  const avg = sc.reduce((a, b) => a + b, 0) / n;
  const sd = n > 1 ? Math.sqrt(sc.reduce((v, x) => v + (x - avg) ** 2, 0) / n) : null;
  return {
    date: session.date.slice(5).split("-").reverse().join("/"),
    avg: +avg.toFixed(1),
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
    <div style={{ background: "#12121f", border: "1px solid #e94560", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#eee", minWidth: 170 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "#e94560", marginBottom: 6 }}>🎳 {d.date}</div>
      <div>Parties : <b>{d.n}</b></div>
      <div>Moyenne : <b style={{ color: "#f0c040" }}>{d.avg}</b></div>
      {d.sd !== null && <div>σ : <b style={{ color: sdColor(d.sd) }}>{d.sd}</b></div>}
      <div>Min <b style={{ color: "#60a5fa" }}>{d.min}</b> · Max <b style={{ color: "#4ade80" }}>{d.max}</b></div>
      {d.trend && <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid #222", color: "#a78bfa" }}>Tendance : <b>{d.trend}</b></div>}
    </div>
  );
};

function StatLine({ icon, value, label, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px" }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 17, fontWeight: 900, color, flexShrink: 0, letterSpacing: 0.5 }}>{value}</span>
      <div style={{ fontSize: 9, color: "#999", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

export default function Dashboard({ sessions }) {
  const [N] = useState(10);

  const data = useMemo(() =>
    [...sessions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(computeStats)
      .filter(Boolean)
  , [sessions]);

  const dataWithTrend = useMemo(() => data.map((d, i) => {
    const win = data.slice(Math.max(0, i - 4), i + 1);
    const trend = +(win.reduce((s, x) => s + x.avg, 0) / win.length).toFixed(1);
    return { ...d, trend };
  }), [data]);

  const allScores = sessions.flatMap(s => s.scores);
  const allTimeAvg = allScores.length ? +(allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : "—";
  const allTimeMax = allScores.length ? Math.max(...allScores) : "—";

  const recent = dataWithTrend.slice(-N);
  const before = dataWithTrend.slice(-N * 2, -N);
  const recentAvg = recent.length ? +(recent.reduce((s, d) => s + d.avg, 0) / recent.length).toFixed(1) : null;
  const beforeAvg = before.length ? +(before.reduce((s, d) => s + d.avg, 0) / before.length).toFixed(1) : null;
  const prog = recentAvg !== null && beforeAvg !== null ? +((recentAvg - beforeAvg)).toFixed(1) : null;

  const yMin = dataWithTrend.length ? Math.floor((Math.min(...dataWithTrend.map(d => d.min)) - 10) / 10) * 10 : 80;
  const yMax = dataWithTrend.length ? Math.ceil((Math.max(...dataWithTrend.map(d => d.max)) + 15) / 10) * 10 : 260;

  if (!sessions.length) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "#444", fontFamily: "'Courier New',monospace", fontSize: 13 }}>
        Aucune session enregistrée.<br />
        <span style={{ color: "#666" }}>Saisis ta première partie ↑</span>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Courier New',monospace", color: "#e0e0e0", padding: "0 0 24px" }}>
      {/* All-time */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
          Historique · {sessions.length} sessions · {allScores.length} parties
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginBottom: 10 }}>
          <StatLine icon="🏆" value={allTimeMax} label="Record" color="#4ade80" />
          <StatLine icon="🎯" value={allTimeAvg} label="Moy. totale" color="#f0c040" />
          <StatLine icon={prog != null ? (prog >= 0 ? "⬆️" : "⬇️") : "—"} value={prog != null ? (prog >= 0 ? "+" : "") + prog : "—"} label={`Prog. (${N})`} color={prog != null ? (prog >= 0 ? "#4ade80" : "#f87171") : "#888"} />
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, margin: "0 10px", padding: "10px 0 6px" }}>
        <div style={{ paddingLeft: 14, marginBottom: 4, fontSize: 10, fontWeight: 700, color: "#f0c040", letterSpacing: 2, textTransform: "uppercase" }}>
          📈 Performance
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={dataWithTrend} margin={{ left: 8, right: 16, top: 8, bottom: 20 }}>
            <defs>
              <linearGradient id="gAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f0c040" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#f0c040" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "#aaa", fontSize: 9 }} angle={-45} textAnchor="end" height={44} stroke="rgba(255,255,255,0.08)" />
            <YAxis domain={[yMin, yMax]} tick={{ fill: "#bbb", fontSize: 11 }} width={38} stroke="rgba(255,255,255,0.08)" tickLine={false} />
            <Tooltip content={<PerfTooltip />} />
            <ReferenceLine y={allTimeAvg} stroke="rgba(240,192,64,0.2)" strokeDasharray="6 3" />
            <Area type="monotone" dataKey="max" stroke="none" fill="rgba(96,165,250,0.07)" />
            <Area type="monotone" dataKey="min" stroke="none" fill="#0a0a18" fillOpacity={1} />
            <Area type="monotone" dataKey="avg" stroke="none" fill="url(#gAvg)" />
            <Line type="monotone" dataKey="min" stroke="#60a5fa" strokeWidth={1} dot={false} strokeDasharray="3 2" />
            <Line type="monotone" dataKey="max" stroke="#4ade80" strokeWidth={1} dot={false} strokeDasharray="3 2" />
            <Line type="monotone" dataKey="trend" stroke="#a78bfa" strokeWidth={2} dot={false} strokeDasharray="6 3" />
            <Line type="monotone" dataKey="avg" stroke="#f0c040" strokeWidth={1.5}
              dot={({ cx, cy, payload }) => {
                const color = payload.sd === null ? "#888" : sdColor(payload.sd);
                return <circle key={cx + cy} cx={cx} cy={cy} r={payload.n >= 8 ? 5 : 3.5} fill={color} stroke="#0a0a18" strokeWidth={1.2} />;
              }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
