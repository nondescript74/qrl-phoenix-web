import { useState } from 'react'
import { discoverStrategies } from '../api/phoenix'
import { useProfile } from '../stores/ProfileContext'
import { useEventLog } from '../stores/EventLogContext'
import WebStrategyCard from '../components/WebStrategyCard'
import Spinner from '../components/Spinner'

export default function Discover() {
  const { profile } = useProfile()
  const { appendEvent } = useEventLog()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)

  async function runDiscovery() {
    setLoading(true)
    setError(null)
    try {
      const data = await discoverStrategies(profile)
      setResult(data)
      appendEvent('WEB_DISCOVERY', {
        count: data.strategies?.length || 0,
        profileSummary: data.profile_summary,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page discover-page">
      <div className="page-header">
        <h1>Discover Strategies</h1>
        <p className="page-subtitle">
          AI-powered web discovery finds strategies matched to your trader profile
        </p>
        <button className="btn-primary" onClick={runDiscovery} disabled={loading}>
          {loading ? 'Searching the web...' : 'Discover Strategies'}
        </button>
      </div>

      {loading && <Spinner text="Searching the web for strategies matching your profile... This may take 2-3 minutes." />}
      {error && <div className="page-error">Error: {error}</div>}

      {result && (
        <>
          <p className="result-summary">
            Found {result.strategies?.length || 0} strategies for: <em>{result.profile_summary}</em>
          </p>
          <div className="discover-grid">
            {result.strategies?.map((s, i) => (
              <WebStrategyCard key={i} strategy={s} onClick={() => setSelected(s)} />
            ))}
          </div>
        </>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            <h2>{selected.strategyName}</h2>
            <p className="wsc-source-link">
              Source: <a href={selected.sourceURL} target="_blank" rel="noopener noreferrer">{selected.sourceSite}</a>
            </p>
            <p>{selected.description}</p>

            <div className="detail-grid-2col">
              <section className="detail-section">
                <h3>Entry Rules</h3>
                <p>{selected.entryRules}</p>
              </section>
              <section className="detail-section">
                <h3>Exit Rules</h3>
                <p>{selected.exitRules}</p>
              </section>
              <section className="detail-section">
                <h3>Market Conditions</h3>
                <p>{selected.marketConditions}</p>
              </section>
              <section className="detail-section">
                <h3>Key Risks</h3>
                <p>{selected.keyRisks}</p>
              </section>
            </div>

            <div className="detail-meta">
              <span>Hold: {selected.holdDuration}</span>
              <span>Risk: {selected.riskLevel}</span>
              <span>Score: {selected.matchScore}/100</span>
              <span>{selected.recommended ? '✓ Recommended' : '— Not recommended'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
