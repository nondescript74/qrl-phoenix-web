import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchIASGRankings } from '../api/phoenix'
import Spinner from '../components/Spinner'

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
      const credentials = {
        email: localStorage.getItem('phoenix_iasg_email') || undefined,
        password: localStorage.getItem('phoenix_iasg_password') || undefined,
      }

      // Try current and past months via backend proxy (avoids CORS)
      const now = new Date()
      for (let offset = 0; offset < 6; offset++) {
        const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
        const month = d.toLocaleString('en-US', { month: 'long' }).toLowerCase()
        const year = d.getFullYear()
        try {
          const data = await fetchIASGRankings(month, year, credentials)
          if (data.rankings && data.rankings.length > 0) {
            setRankings(data.rankings)
            return
          }
        } catch {
          continue
        }
      }
      setError('Could not fetch IASG rankings. Make sure your IASG credentials are saved in Settings and the backend is running.')
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
