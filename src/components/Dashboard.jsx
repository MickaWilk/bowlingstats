import { useMemo } from "react";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

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

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 16px", fontSize: 12, color: "var(--text)", boxShadow: "var(--shadow)", minWidth: 160 }}>
      <div style={{ fontWeight: 700, color: "var(--primary)", marginBottom: 8 }}>🎳 {d.date}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Row label="Parties" value={d.n} color="var(--text)" />
        <Row label="Moyenne" value={d.avg} color="var(--gold)" />
        {d.sd !== null && <Row label="Régularité σ" value={d.sd} color={sdColor(d.sd)} />}
        <Row label="Min / Max" value={`${d.min} / ${d.max}`} color="var(--blue)" />
        {d.trend && <Row label="Tendance" value={d.trend} color="var(--purple)" />}
      </div>
    </div>
  );
};

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
      <span style={{ color: "var(--text-2)" }}>{label}</span>
      <span style={{ fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function StatCard({ icon, value, label, color, sub }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "14px 12px" }}>
      <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard({ sessions }) {
  const N = 10;

  const data = useMemo(() =>
    [...sessions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(computeStats)
      .filter(Boolean)
  , [sessions]);

  const withTrend = useMemo(() => data.map((d, i) => {
    const win = data.slice(Math.max(0, i - 4), i + 1);
    const trend = +(win.reduce((s, x) => s + x.avg, 0) / win.length).toFixed(1);
    return { ...d, trend };
  }), [data]);

  const allScores = sessions.flatMap(s => (s.scores || []).filter(Number.isFinite));
  const allTimeAvg = allScores.length ? +(allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : "—";
  const allTimeMax = allScores.length ? Math.max(...allScores) : "—";

  const recent = withTrend.slice(-N);
  const before = withTrend.slice(-N * 2, -N);
  const recentAvg = recent.length ? +(recent.reduce((s, d) => s + d.avg, 0) / recent.length).toFixed(1) : null;
  const beforeAvg = before.length ? +(before.reduce((s, d) => s + d.avg, 0) / before.length).toFixed(1) : null;
  const prog = recentAvg !== null && beforeAvg !== null ? +((recentAvg - beforeAvg)).toFixed(1) : null;

  const yMin = withTrend.length ? Math.floor((Math.min(...withTrend.map(d => d.min)) - 10) / 10) * 10 : 80;
  const yMax = withTrend.length ? Math.ceil((Math.max(...withTrend.map(d => d.max)) + 15) / 10) * 10 : 260;

  if (!sessions.length) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎳</div>
        <p style={{ color: "var(--text-2)", fontSize: 15 }}>Aucune session pour l'instant.</p>
        <p style={{ color: "var(--text-3)", fontSize: 13, marginTop: 4 }}>Enregistre ta première partie !</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 16px 32px" }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 20 }}>
        Statistiques
      </h2>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
        <StatCard icon="🏆" value={allTimeMax} label="Record" color="var(--green)" />
        <StatCard icon="🎯" value={allTimeAvg} label="Moyenne" color="var(--gold)" />
        <StatCard
          icon={prog != null ? (prog >= 0 ? "📈" : "📉") : "—"}
          value={prog != null ? (prog >= 0 ? `+${prog}` : prog) : "—"}
          label={`Prog. (${N})`}
          color={prog != null ? (prog >= 0 ? "var(--green)" : "var(--red)") : "var(--text-3)"}
          sub={recentAvg && beforeAvg ? `${beforeAvg} → ${recentAvg}` : null}
        />
      </div>

      {/* Chart */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 0 8px", marginBottom: 8 }}>
        <div style={{ paddingLeft: 16, marginBottom: 12, fontSize: 12, fontWeight: 700, color: "var(--text-2)", letterSpacing: 1, textTransform: "uppercase" }}>
          Performance · {sessions.length} sessions
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={withTrend} margin={{ left: 0, right: 16, top: 4, bottom: 24 }}>
            <defs>
              <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.12} />
                <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fill: "var(--text-3)", fontSize: 9 }} angle={-45} textAnchor="end" height={44} stroke="var(--border)" />
            <YAxis domain={[yMin, yMax]} tick={{ fill: "var(--text-2)", fontSize: 10 }} width={36} stroke="var(--border)" tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={+allTimeAvg} stroke="var(--gold)" strokeOpacity={0.2} strokeDasharray="6 4" />
            <Area type="monotone" dataKey="max" stroke="none" fill="rgba(96,165,250,0.06)" />
            <Area type="monotone" dataKey="min" stroke="none" fill="var(--bg)" fillOpacity={1} />
            <Area type="monotone" dataKey="avg" stroke="none" fill="url(#gArea)" />
            <Line type="monotone" dataKey="min" stroke="var(--blue)" strokeWidth={1} dot={false} strokeDasharray="3 2" />
            <Line type="monotone" dataKey="max" stroke="var(--green)" strokeWidth={1} dot={false} strokeDasharray="3 2" />
            <Line type="monotone" dataKey="trend" stroke="var(--purple)" strokeWidth={2} dot={false} strokeDasharray="6 3" />
            <Line type="monotone" dataKey="avg" stroke="var(--gold)" strokeWidth={2}
              dot={({ cx, cy, payload }) => (
                <circle key={`${cx}${cy}`} cx={cx} cy={cy}
                  r={payload.n >= 8 ? 5 : 3.5}
                  fill={payload.sd === null ? "var(--text-3)" : sdColor(payload.sd)}
                  stroke="var(--bg)" strokeWidth={1.5} />
              )} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center" }}>
        Point coloré = régularité · 🟢 σ&lt;15 · 🟡 15–25 · 🔴 &gt;25
      </p>
    </div>
  );
}
