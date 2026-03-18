import MatchScoreCircle from './MatchScoreCircle'
import TagPill from './TagPill'
import ConflictPill from './ConflictPill'

export default function WebStrategyCard({ strategy, onClick }) {
  const s = strategy
  return (
    <div className={`web-strategy-card${s.recommended ? ' recommended' : ''}`} onClick={onClick} role="button" tabIndex={0}>
      <div className="wsc-top">
        <div className="wsc-info">
          <h3 className="wsc-name">{s.strategyName}</h3>
          <p className="wsc-source">{s.sourceSite}</p>
          <p className="wsc-desc">{s.description}</p>
        </div>
        <MatchScoreCircle score={s.matchScore} />
      </div>
      <div className="wsc-tags">
        {s.instruments?.map((inst, i) => (
          <TagPill key={i} label={inst} variant="instrument" />
        ))}
        <TagPill label={s.riskLevel} variant={s.riskLevel === 'high' ? 'risk' : 'default'} />
        <TagPill label={s.holdDuration} variant="default" />
      </div>
      {s.conflicts?.length > 0 && (
        <div className="wsc-conflicts">
          {s.conflicts.map((c, i) => (
            <ConflictPill key={i} severity={c.severity} message={c.message} />
          ))}
        </div>
      )}
      {s.matchReasons?.length > 0 && (
        <ul className="wsc-reasons">
          {s.matchReasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
