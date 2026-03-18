export default function ConflictPill({ severity, message }) {
  return (
    <span className={`conflict-pill conflict-${severity}`}>
      {severity === 'high' ? '!' : '~'} {message}
    </span>
  )
}
