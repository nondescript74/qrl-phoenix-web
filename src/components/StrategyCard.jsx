import TagPill from './TagPill'

export default function StrategyCard({ strategy, onClick }) {
  const s = strategy
  return (
    <div className="strategy-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="sc-header">
        <h3 className="sc-name">{s.strategyName || s.name}</h3>
        {s.credibility?.winRate != null && (
          <span className="sc-stat">{(s.credibility.winRate * 100).toFixed(0)}% WR</span>
        )}
      </div>
      {s.description && <p className="sc-desc">{s.description}</p>}
      <div className="sc-tags">
        {s.instruments?.map((inst, i) => (
          <TagPill key={i} label={typeof inst === 'string' ? inst : inst.symbol} variant="instrument" />
        ))}
        {s.credibility?.sharpeRatio != null && (
          <TagPill label={`Sharpe ${s.credibility.sharpeRatio.toFixed(2)}`} variant="metric" />
        )}
        {s.credibility?.maxDrawdown != null && (
          <TagPill label={`DD ${(s.credibility.maxDrawdown * 100).toFixed(0)}%`} variant="risk" />
        )}
      </div>
    </div>
  )
}
