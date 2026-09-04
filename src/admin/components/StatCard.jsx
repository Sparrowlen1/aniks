import { Link } from 'react-router-dom'

function StatCard({ label, value, sub, icon: Icon, bg, textColor = '#fff', to }) {
  const Tag = to ? (to.startsWith('#') ? 'a' : Link) : 'div'
  const linkProp = to ? (to.startsWith('#') ? { href: to } : { to }) : {}

  return (
    <Tag
      {...linkProp}
      style={{ background: bg, color: textColor }}
      className={`block rounded-none rounded-tr-xl rounded-bl-xl p-4 ${to ? 'transition-transform hover:-translate-y-0.5 hover:shadow-md' : ''}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold tracking-wide opacity-80">{label}</p>
        {Icon && (
          <div style={{ background: 'rgba(255,255,255,0.2)' }} className="rounded-lg p-1.5">
            <Icon size={16} />
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs opacity-80">{sub}</p>}
    </Tag>
  )
}

export default StatCard
