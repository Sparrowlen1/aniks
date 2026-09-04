import { useAdminColors } from '../theme'

function ComingSoon({ title }) {
  const COLORS = useAdminColors()

  return (
    <div
      style={{ borderColor: COLORS.border, color: COLORS.text }}
      className="flex h-full min-h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed text-center"
    >
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 max-w-sm text-sm" style={{ color: COLORS.muted }}>
        This section is under construction — check back soon.
      </p>
    </div>
  )
}

export default ComingSoon
