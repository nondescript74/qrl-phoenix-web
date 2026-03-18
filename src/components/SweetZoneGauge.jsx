export default function SweetZoneGauge({ label, value, max = 100, format }) {
  const pct = Math.min(100, (value / max) * 100)
  const color =
    pct >= 66 ? 'var(--green)' : pct >= 33 ? 'var(--gold)' : 'var(--red)'

  return (
    <div className="sz-gauge">
      <div className="sz-gauge-label">{label}</div>
      <div className="sz-gauge-bar">
        <div className="sz-gauge-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="sz-gauge-value" style={{ color }}>
        {format ? format(value) : value.toFixed(1)}
      </div>
    </div>
  )
}
