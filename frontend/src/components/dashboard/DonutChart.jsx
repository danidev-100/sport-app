import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{d.name}</p>
      <p className="text-muted-foreground">
        {d.value} cuota{d.value !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

const CenterLabel = ({ pagadas, total, pct }) => (
  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
    <span className="text-4xl font-bold tabular-nums tracking-tight">
      {pct}%
    </span>
    <span className="text-xs text-muted-foreground mt-0.5">
      {pagadas} / {total} cuotas
    </span>
  </div>
);

const DonutChart = ({ data, loading }) => {
  const [selectedIdx, setSelectedIdx] = useState(
    () => new Date().getMonth()
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-6" />
        <div className="flex justify-center">
          <div className="w-56 h-56 rounded-full bg-muted" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">
          Sin datos
        </div>
      </div>
    );
  }

  // Clamp selected index
  const idx = Math.min(selectedIdx, data.length - 1);
  const month = data[idx];
  if (!month) return null;

  const pagadas = month.pagadas;
  const pendientes = month.pendientes;
  const total = month.total;
  const pct = total > 0 ? Math.round((pagadas / total) * 100) : 0;

  const pieData = [
    { name: 'Pagadas', value: pagadas, color: 'hsl(142.4 71.8% 45.3%)' },
    { name: 'Pendientes', value: pendientes, color: 'hsl(0 62.8% 50%)' },
  ].filter((d) => d.value > 0);

  // If no data, show empty state
  if (pieData.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">
          Sin cuotas para este mes
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-sm font-medium text-foreground">Cuotas pagadas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {MONTHS[idx]} — {total} cuota{total !== 1 ? 's' : ''} emitida{total !== 1 ? 's' : ''}
          </p>
        </div>
        <select
          value={idx}
          onChange={(e) => setSelectedIdx(Number(e.target.value))}
          className="rounded-lg border border-border/50 bg-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {data.map((d, i) => (
            <option key={d.mes} value={i} className="bg-card">
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="relative flex items-center justify-center py-4">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              animationBegin={100}
              animationDuration={600}
            >
              {pieData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.color}
                  className="drop-shadow-sm"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          </PieChart>
        </ResponsiveContainer>
        <CenterLabel pagadas={pagadas} total={total} pct={pct} />
      </div>

      <div className="flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(142.4 71.8% 45.3%)' }} />
          <span className="text-muted-foreground">Pagadas</span>
          <span className="font-medium text-foreground">{pagadas}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(0 62.8% 50%)' }} />
          <span className="text-muted-foreground">Pendientes</span>
          <span className="font-medium text-foreground">{pendientes}</span>
        </div>
      </div>
    </div>
  );
};

export default DonutChart;
