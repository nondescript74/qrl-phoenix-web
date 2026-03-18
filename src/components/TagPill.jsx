export default function TagPill({ label, variant = 'default' }) {
  return <span className={`tag-pill tag-${variant}`}>{label}</span>
}
