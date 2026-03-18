import { useState, useEffect, useMemo } from 'react'
import { fetchStrategies } from '../api/phoenix'
import StrategyCard from '../components/StrategyCard'
import Spinner from '../components/Spinner'

const ASSET_FILTERS = ['All', 'Futures', 'Options', 'Equities']
const SORT_OPTIONS = [
  { key: 'winRate', label: 'Win Rate' },
  { key: 'sharpe', label: 'Sharpe Ratio' },
  { key: 'vintage', label: 'Vintage' },
]

export default function Strategies() {
  const [strategies, setStrategies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [assetFilter, setAssetFilter] = useState('All')
  const [sortBy, setSortBy] = useState('winRate')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchStrategies()
      .then((data) => setStrategies(data.strategies || data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = [...strategies]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.strategyName?.toLowerCase().includes(q) ||
          s.prophetId?.toLowerCase().includes(q)
      )
    }
    if (assetFilter !== 'All') {
      list = list.filter((s) =>
        s.instruments?.some((i) => {
          const cls = (typeof i === 'string' ? i : i.assetClass || '').toLowerCase()
          return cls.includes(assetFilter.toLowerCase())
        })
      )
    }
    list.sort((a, b) => {
      if (sortBy === 'winRate') return (b.credibility?.winRate || 0) - (a.credibility?.winRate || 0)
      if (sortBy === 'sharpe') return (b.credibility?.sharpeRatio || 0) - (a.credibility?.sharpeRatio || 0)
      if (sortBy === 'vintage') return (b.credibility?.vintage || 0) - (a.credibility?.vintage || 0)
      return 0
    })
    return list
  }, [strategies, search, assetFilter, sortBy])

  if (loading) return <Spinner text="Fetching QRL-verified strategies..." />
  if (error) return <div className="page-error">Error: {error}</div>

  return (
    <div className="page strategies-page">
      <div className="page-header">
        <h1>QRL Verified Strategies</h1>
        <p className="page-subtitle">Blockchain-verified trading strategies with immutable audit trails</p>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Search strategies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-group">
          {ASSET_FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-btn${assetFilter === f ? ' active' : ''}`}
              onClick={() => setAssetFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="strategy-grid">
        {filtered.map((s, i) => (
          <StrategyCard key={i} strategy={s} onClick={() => setSelected(s)} />
        ))}
        {filtered.length === 0 && <p className="empty-state">No strategies match your filters.</p>}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            <h2>{selected.strategyName || selected.name}</h2>
            {selected.description && <p>{selected.description}</p>}

            {selected.entryRules && (
              <section className="detail-section">
                <h3>Entry Rules</h3>
                {Array.isArray(selected.entryRules) ? (
                  <ul>{selected.entryRules.map((r, i) => <li key={i}>{r.indicator}: {r.condition} {r.threshold}</li>)}</ul>
                ) : (
                  <p>{JSON.stringify(selected.entryRules)}</p>
                )}
              </section>
            )}

            {selected.exitRules && (
              <section className="detail-section">
                <h3>Exit Rules</h3>
                <p>Stop: {selected.exitRules.stopLoss || 'N/A'}</p>
                <p>Target: {selected.exitRules.takeProfit || 'N/A'}</p>
                <p>Time: {selected.exitRules.timeExit || 'N/A'}</p>
              </section>
            )}

            {selected.credibility && (
              <section className="detail-section">
                <h3>Credentials</h3>
                <div className="detail-grid">
                  <div>Win Rate: {((selected.credibility.winRate || 0) * 100).toFixed(0)}%</div>
                  <div>Sharpe: {(selected.credibility.sharpeRatio || 0).toFixed(2)}</div>
                  <div>Max DD: {((selected.credibility.maxDrawdown || 0) * 100).toFixed(0)}%</div>
                  <div>Vintage: {selected.credibility.vintage || 'N/A'}</div>
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
