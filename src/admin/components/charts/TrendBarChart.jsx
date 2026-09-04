import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts'

function formatKES(value) {
  return `KES ${value.toLocaleString()}`
}

function CustomTooltip({ active, payload, label, colors }) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{ background: colors.panel, border: `1px solid ${colors.border}`, color: colors.text }}
      className="rounded-lg px-3 py-1.5 text-xs font-semibold shadow-lg"
    >
      {label} · {formatKES(payload[0].value)}
    </div>
  )
}

function TrendBarChart({ data, colors }) {
  return (
    <div style={{ height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: colors.muted, fontSize: 12 }}
          />
          <Tooltip cursor={{ fill: colors.border, opacity: 0.4 }} content={<CustomTooltip colors={colors} />} />
          <Bar dataKey="value" fill={colors.blue} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TrendBarChart
