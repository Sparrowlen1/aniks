import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

function DonutChart({ data, centerValue, centerLabel, colors }) {
  return (
    <div className="relative mx-auto" style={{ width: 140, height: 140 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="percent"
            nameKey="label"
            innerRadius={44}
            outerRadius={64}
            startAngle={90}
            endAngle={-270}
            stroke={colors.panel}
            strokeWidth={2}
          >
            {data.map((slice) => (
              <Cell key={slice.label} fill={slice.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color: colors.text }}>
          {centerValue}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.muted }}>
          {centerLabel}
        </span>
      </div>
    </div>
  )
}

export default DonutChart
