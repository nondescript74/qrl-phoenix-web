export default function MatchScoreCircle({ score, size = 56 }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--gold)' : 'var(--red)'

  return (
    <svg width={size} height={size} className="match-circle">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={3} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dy="0.35em" fill={color} fontSize={size * 0.3} fontWeight={700}>
        {score}
      </text>
    </svg>
  )
}
