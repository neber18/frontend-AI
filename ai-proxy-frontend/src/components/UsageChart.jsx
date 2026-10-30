import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumber, formatShortDay } from '../utils/format.js';

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{item.label}</strong>
      <div>{formatNumber(item.tokens)} tokens</div>
      <div className="muted">{item.requests} solicitudes</div>
    </div>
  );
}

export default function UsageChart({ history }) {
  const data = history.map((d) => ({ ...d, label: formatShortDay(d.date) }));
  const totalTokens = history.reduce((sum, d) => sum + d.tokens, 0);
  const totalRequests = history.reduce((sum, d) => sum + d.requests, 0);

  return (
    <div className="card">
      <div className="card-head">
        <h2>Uso de los últimos 7 días</h2>
      </div>
      <div className="stat-row compact">
        <span>{formatNumber(totalTokens)} tokens</span>
        <span className="muted">{totalRequests} solicitudes</span>
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--hover)' }} />
            <Bar dataKey="tokens" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
