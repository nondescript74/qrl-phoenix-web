import { useState } from 'react'
import { useEventLog } from '../stores/EventLogContext'

const EVENT_TYPES = [
  'All',
  'PROFILE_CAPTURED',
  'PROFILE_EXCHANGE',
  'STRATEGY_ANALYSIS',
  'WEB_DISCOVERY',
  'STRATEGY_TRACKED',
  'CTA_EVALUATION',
]

export default function Ledger() {
  const { events, verifyChain, clearEvents } = useEventLog()
  const [filter, setFilter] = useState('All')
  const [chainStatus, setChainStatus] = useState(null)
  const [selected, setSelected] = useState(null)

  const filtered = filter === 'All' ? events : events.filter((e) => e.type === filter)

  async function handleVerify() {
    const result = await verifyChain()
    setChainStatus(result)
  }

  return (
    <div className="page ledger-page">
      <div className="page-header">
        <h1>Phoenix Ledger</h1>
        <p className="page-subtitle">
          SHA-256 hash-chained event log — {events.length} events recorded
        </p>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleVerify}>Verify Chain</button>
          {events.length > 0 && (
            <button className="btn-secondary" onClick={() => {
              if (confirm('Clear all events? This cannot be undone.')) clearEvents()
            }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {chainStatus && (
        <div className={`chain-status ${chainStatus.valid ? 'valid' : 'invalid'}`}>
          {chainStatus.valid
            ? `Chain verified — all ${events.length} events intact`
            : `Chain broken at event #${chainStatus.brokenAt}`}
        </div>
      )}

      <div className="filter-bar">
        {EVENT_TYPES.map((t) => (
          <button
            key={t}
            className={`filter-btn${filter === t ? ' active' : ''}`}
            onClick={() => setFilter(t)}
          >
            {t === 'All' ? 'All' : t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="ledger-timeline">
        {filtered.length === 0 && <p className="empty-state">No events recorded yet.</p>}
        {[...filtered].reverse().map((e, i) => (
          <div key={i} className="ledger-event" onClick={() => setSelected(e)}>
            <div className="le-dot" />
            <div className="le-content">
              <div className="le-header">
                <span className="le-type">{e.type.replace(/_/g, ' ')}</span>
                <span className="le-time">{new Date(e.timestamp).toLocaleString()}</span>
              </div>
              <div className="le-hash">
                {e.hash?.slice(0, 16)}...
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            <h2>Event #{selected.index}</h2>
            <div className="event-detail">
              <div className="ed-row"><strong>Type:</strong> {selected.type}</div>
              <div className="ed-row"><strong>Timestamp:</strong> {selected.timestamp}</div>
              <div className="ed-row ed-hash"><strong>Hash:</strong> <code>{selected.hash}</code></div>
              <div className="ed-row ed-hash"><strong>Prev Hash:</strong> <code>{selected.prevHash}</code></div>
              <div className="ed-row">
                <strong>Payload:</strong>
                <pre className="ed-payload">{JSON.stringify(selected.payload, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
