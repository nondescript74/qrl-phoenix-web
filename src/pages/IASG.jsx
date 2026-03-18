import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'

// Lightweight IASG HTML parser (mirrors iOS regex parser)
function parseIASGHTML(html) {
  const rankings = []
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
  const linkRegex = /<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i
  const rows = html.match(rowRegex) || []

  for (const row of rows) {
    const cells = row.match(cellRegex) || []
    if (cells.length < 5) continue

    const stripTags = (s) => s.replace(/<[^>]*>/g, '').trim()
    const rankText = stripTags(cells[0])
    const rank = parseInt(rankText, 10)
    if (isNaN(rank) || rank <= 0) continue

    const groupMatch = cells[1].match(linkRegex)
    const programMatch = cells[2].match(linkRegex)
    const perfText = stripTags(cells[3])
    const inceptionText = stripTags(cells[4])

    rankings.push({
      rank,
      group_name: groupMatch ? groupMatch[2].trim() : stripTags(cells[1]),
      group_url: groupMatch ? groupMatch[1] : '',
      program_name: programMatch ? programMatch[2].trim() : stripTags(cells[2]),
      program_url: programMatch ? `https://www.iasg.com${programMatch[1]}` : '',
      performance: parseFloat(perfText) || 0,
      inception_date: inceptionText,
    })
  }
  return rankings
}

export default function IASG() {
  const navigate = useNavigate()
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [evalCount, setEvalCount] = useState(10)

  const loadRankings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Try current and past months
      const now = new Date()
      let html = null
      for (let offset = 0; offset < 6; offset++) {
        const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
        const month = d.toLocaleString('en-US', { month: 'long' }).toLowerCase()
        const year = d.getFullYear()
        const url = `https://www.iasg.com/cta-rankings/${month}-${year}`
        try {
          // Use a CORS proxy or direct fetch
          const res = await fetch(url)
          if (res.ok) {
            html = await res.text()
            const parsed = parseIASGHTML(html)
            if (parsed.length > 0) {
              setRankings(parsed)
              return
            }
          }
        } catch {
          continue
        }
      }
      setError('Could not fetch IASG rankings. The rankings may require IASG credentials or a proxy. You can paste rankings data in Settings.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleAnalyze(ranking) {
    navigate('/iasg/analysis', { state: { ranking } })
  }

  function handleEvaluate() {
    const top = rankings.slice(0, evalCount)
    navigate('/iasg/evaluate', { state: { rankings: top } })
  }

  return (
    <div className="page iasg-page">
      <div className="page-header">
        <h1>IASG CTA Rankings</h1>
        <p className="page-subtitle">Monthly CTA Index rankings with AI-powered analysis and evaluation</p>
        <div className="header-actions">
          <button className="btn-primary" onClick={loadRankings} disabled={loading}>
            {loading ? 'Loading...' : 'Load Rankings'}
          </button>
          {rankings.length > 0 && (
            <div className="eval-controls">
              <label>
                Evaluate top
                <input
                  type="number"
                  className="eval-count-input"
                  min={3}
                  max={rankings.length}
                  value={evalCount}
                  onChange={(e) => setEvalCount(Number(e.target.value))}
                />
              </label>
              <button className="btn-gold" onClick={handleEvaluate}>
                Evaluate CTAs
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && <Spinner text="Fetching IASG rankings..." />}
      {error && <div className="page-error">{error}</div>}

      {rankings.length > 0 && (
        <div className="iasg-table-wrap">
          <table className="iasg-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Group</th>
                <th>Program</th>
                <th>YTD %</th>
                <th>Inception</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r) => (
                <tr key={r.rank}>
                  <td className="rank-cell">{r.rank}</td>
                  <td>{r.group_name}</td>
                  <td>
                    {r.program_url ? (
                      <a href={r.program_url} target="_blank" rel="noopener noreferrer">{r.program_name}</a>
                    ) : (
                      r.program_name
                    )}
                  </td>
                  <td className={`perf-cell ${r.performance >= 0 ? 'positive' : 'negative'}`}>
                    {r.performance.toFixed(2)}%
                  </td>
                  <td>{r.inception_date}</td>
                  <td>
                    <button className="btn-small" onClick={() => handleAnalyze(r)}>Analyze</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
