import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { evaluateCTAs } from '../api/phoenix'
import { useEventLog } from '../stores/EventLogContext'
import TagPill from '../components/TagPill'
import Spinner from '../components/Spinner'

function RegimePanel({ regime }) {
  if (!regime) return null
  return (
    <section className="eval-section regime-panel">
      <h2>Market Regime</h2>
      <div className="regime-header">
        <TagPill label={regime.current} variant={regime.current === 'trending' ? 'green' : regime.current === 'volatile' ? 'risk' : 'default'} />
        <span className="regime-confidence">Confidence: {(regime.confidence * 100).toFixed(0)}%</span>
      </div>
      <p className="regime-signal">{regime.signal}</p>
      {regime.shift_detected && (
        <div className="regime-shift">
          Regime Shift Detected: {regime.shift_description}
          {regime.prior_regime && <span> (prior: {regime.prior_regime})</span>}
        </div>
      )}
      {regime.metrics && Object.keys(regime.metrics).length > 0 && (
        <div className="regime-metrics">
          {Object.entries(regime.metrics).map(([sym, m]) => (
            <div key={sym} className="regime-metric-card">
              <strong>{m.label || sym}</strong>
              <div>Trend: {m.trend_strength?.toFixed(1)}</div>
              <div>Vol %ile: {m.volatility_percentile?.toFixed(1)}</div>
              <div>Hurst: {m.hurst?.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function CandidateCard({ candidate }) {
  const c = candidate
  const [expanded, setExpanded] = useState(false)
  const decisionColor = c.decision === 'select' ? 'green' : c.decision === 'reject' ? 'risk' : 'default'

  return (
    <div className={`candidate-card decision-${c.decision}`} onClick={() => setExpanded(!expanded)}>
      <div className="cc-header">
        <div className="cc-rank">#{c.rank}</div>
        <div className="cc-info">
          <h4>{c.program_name}</h4>
          <span className="cc-group">{c.group_name}</span>
        </div>
        <div className="cc-scores">
          <TagPill label={c.decision.toUpperCase()} variant={decisionColor} />
          <span className="cc-weight">{c.allocation_weight?.toFixed(1)}%</span>
        </div>
      </div>

      {expanded && (
        <div className="cc-details">
          <p className="cc-reasoning">{c.reasoning}</p>
          <div className="cc-meta">
            <span>Score: {(c.evaluation_score * 100).toFixed(0)}</span>
            <span>Regime: {c.regime_alignment}</span>
            <span>Type: {c.strategy_type_inferred}</span>
            <span>Conf: {(c.confidence * 100).toFixed(0)}%</span>
          </div>

          {c.risk_flags?.length > 0 && (
            <div className="cc-risks">
              <strong>Risks:</strong>
              {c.risk_flags.map((f, i) => <TagPill key={i} label={f} variant="risk" />)}
            </div>
          )}

          {c.hypotheses?.length > 0 && (
            <div className="cc-hypotheses">
              <strong>MHT Results:</strong>
              {c.hypotheses.map((h, i) => (
                <div key={i} className={`hypothesis ${h.result}`}>
                  <span className="h-result">{h.result}</span>
                  <span className="h-text">{h.hypothesis}</span>
                  {h.evidence && <span className="h-evidence">{h.evidence}</span>}
                </div>
              ))}
            </div>
          )}

          {c.contradictions_surfaced?.length > 0 && (
            <div className="cc-contradictions">
              <strong>Contradictions:</strong>
              {c.contradictions_surfaced.map((ct, i) => (
                <div key={i} className={`contradiction sev-${ct.severity}`}>
                  {ct.hypothesis}: {ct.evidence}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CTAEvaluation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { appendEvent } = useEventLog()
  const inputRankings = location.state?.rankings

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!inputRankings?.length) return
    setLoading(true)
    evaluateCTAs(inputRankings, inputRankings.length)
      .then((data) => {
        setResult(data)
        appendEvent('CTA_EVALUATION', {
          count: data.candidates?.length,
          selected: data.portfolio_summary?.selected,
          regime: data.regime?.current,
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [inputRankings])

  if (!inputRankings?.length) {
    return (
      <div className="page">
        <p>No rankings provided for evaluation.</p>
        <button className="btn-secondary" onClick={() => navigate('/iasg')}>Back to IASG</button>
      </div>
    )
  }

  if (loading) return <Spinner text="Running CTA evaluation pipeline... Regime detection, MHT testing, portfolio construction. This may take 3-5 minutes." />
  if (error) return <div className="page"><div className="page-error">{error}</div><button className="btn-secondary" onClick={() => navigate('/iasg')}>Back</button></div>
  if (!result) return null

  const { regime, candidates, portfolio_summary, similarity, pipeline_timing } = result

  return (
    <div className="page eval-page">
      <button className="btn-back" onClick={() => navigate('/iasg')}>← Back to Rankings</button>
      <h1>CTA Evaluation Results</h1>

      {/* Architecture Mapping Banner — Gap 2: Signal Strength */}
      <section className="eval-section" style={{
        background: 'linear-gradient(135deg, rgba(0,26,54,0.95), rgba(0,40,80,0.85))',
        border: '1px solid rgba(179,144,92,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#94a3b8', marginTop: 0, marginBottom: '14px' }}>ARCHITECTURE MAPPING</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', alignItems: 'center', gap: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', marginBottom: '4px' }}>🔗</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa' }}>FAISS</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Manager Similarity</div>
          </div>
          <div style={{ color: '#B3905C', fontSize: '14px' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', marginBottom: '4px' }}>🧪</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#a78bfa' }}>MHT</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Hypothesis Testing</div>
          </div>
          <div style={{ color: '#B3905C', fontSize: '14px' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', marginBottom: '4px' }}>📊</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#22c55e' }}>OUTPUT</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Allocation Decision</div>
          </div>
        </div>
      </section>

      <RegimePanel regime={regime} />

      {portfolio_summary && (
        <section className="eval-section portfolio-summary">
          <h2>Portfolio Summary</h2>
          <div className="portfolio-stats">
            <div className="ps-stat"><span className="ps-num">{portfolio_summary.selected}</span><span className="ps-label">Selected</span></div>
            <div className="ps-stat"><span className="ps-num">{portfolio_summary.watchlist}</span><span className="ps-label">Watchlist</span></div>
            <div className="ps-stat"><span className="ps-num">{portfolio_summary.rejected}</span><span className="ps-label">Rejected</span></div>
            <div className="ps-stat"><span className="ps-num">{(similarity?.diversification_score || portfolio_summary.diversification_score || 0).toFixed(2)}</span><span className="ps-label">Diversification</span></div>
          </div>
        </section>
      )}

      {similarity?.clusters?.length > 0 && (
        <section className="eval-section">
          <h2>Strategy Clusters (FAISS)</h2>
          <div className="cluster-grid">
            {similarity.clusters.map((cl, i) => (
              <div key={i} className="cluster-card">
                <h4>{cl.name}</h4>
                <TagPill label={cl.strategy_type || 'mixed'} variant="instrument" />
                <p>{cl.member_names?.join(', ') || `${cl.count} members`}</p>
              </div>
            ))}
          </div>

          {similarity.similarity_pairs?.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '12px', letterSpacing: '1px', color: '#f97316', marginBottom: '8px' }}>
                ⚠ CONCENTRATION RISK PAIRS
              </h3>
              {similarity.similarity_pairs.map((pair, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px',
                  padding: '8px 12px', borderRadius: '8px', background: 'rgba(249,115,22,0.06)',
                  border: '1px solid rgba(249,115,22,0.15)'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{pair.a_name || `CTA ${pair.a}`}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>↔</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{pair.b_name || `CTA ${pair.b}`}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: pair.similarity > 0.8 ? '#ef4444' : '#f97316' }}>
                    {(pair.similarity * 100).toFixed(0)}%
                  </span>
                  {pair.reason && <span style={{ fontSize: '10px', color: '#94a3b8' }}>{pair.reason}</span>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="eval-section">
        <h2>Evaluated Candidates</h2>
        <div className="candidates-list">
          {candidates?.map((c, i) => <CandidateCard key={i} candidate={c} />)}
        </div>
      </section>

      {pipeline_timing && (
        <section className="eval-section timing-section">
          <h2>Pipeline Timing</h2>
          <div className="timing-bars">
            {Object.entries(pipeline_timing).filter(([k]) => k !== 'total_ms').map(([k, v]) => (
              <div key={k} className="timing-row">
                <span className="timing-label">{k.replace(/_ms$/, '').replace(/_/g, ' ')}</span>
                <div className="timing-bar">
                  <div className="timing-fill" style={{ width: `${Math.min(100, (v / (pipeline_timing.total_ms || 1)) * 100)}%` }} />
                </div>
                <span className="timing-value">{(v / 1000).toFixed(1)}s</span>
              </div>
            ))}
            <div className="timing-total">Total: {(pipeline_timing.total_ms / 1000).toFixed(1)}s</div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>
              ⏱ What took weeks of manual analysis → {(pipeline_timing.total_ms / 1000).toFixed(1)}s automated
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
