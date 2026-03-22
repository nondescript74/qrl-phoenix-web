import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchIASGRankings } from '../api/phoenix'
import Spinner from '../components/Spinner'

const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december']

export default function IASG() {
  const navigate = useNavigate()
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [evalCount, setEvalCount] = useState(10)
  const [dataPeriod, setDataPeriod] = useState(null)

  // Month navigation state
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()) // 0-indexed
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  function stepMonth(delta) {
    let m = selectedMonth + delta
    let y = selectedYear
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setSelectedMonth(m)
    setSelectedYear(y)
  }

  const loadRankings = useCallback(async () => {
    setLoading(true)
    setError(null)
    setDataPeriod(null)
    try {
      const credentials = {
        email: localStorage.getItem('phoenix_iasg_email') || undefined,
        password: localStorage.getItem('phoenix_iasg_password') || undefined,
      }

      const month = MONTHS[selectedMonth]
      const year = selectedYear

      const data = await fetchIASGRankings(month, year, credentials)
      if (data.rankings && data.rankings.length > 0) {
        setRankings(data.rankings)
        if (data.actual_month || data.actual_year) {
          const actualMonth = (data.actual_month || month)
          const actualYear = data.actual_year || year
          setDataPeriod(`${actualMonth.charAt(0).toUpperCase() + actualMonth.slice(1)} ${actualYear}`)
        }
      } else {
        setError('No rankings data returned from IASG.')
      }
    } catch (err) {
      setError(err.message || 'Could not fetch IASG rankings. Check that the backend is running.')
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

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

        {/* Month navigation */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', margin: '12px 0',
          background: 'rgba(0,26,54,0.4)', padding: '8px 16px', borderRadius: '8px', width: 'fit-content'
        }}>
          <button onClick={() => stepMonth(-1)} style={{
            background: 'none', border: 'none', color: '#B3905C', fontSize: '18px', cursor: 'pointer', padding: '4px 8px'
          }}>◀</button>
          <span style={{ fontSize: '15px', fontWeight: 600, minWidth: '150px', textAlign: 'center' }}>
            {MONTHS[selectedMonth].charAt(0).toUpperCase() + MONTHS[selectedMonth].slice(1)} {selectedYear}
          </span>
          <button onClick={() => stepMonth(1)} disabled={selectedMonth === now.getMonth() && selectedYear === now.getFullYear()} style={{
            background: 'none', border: 'none', color: '#B3905C', fontSize: '18px', cursor: 'pointer', padding: '4px 8px',
            opacity: (selectedMonth === now.getMonth() && selectedYear === now.getFullYear()) ? 0.3 : 1
          }}>▶</button>
        </div>

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

      {dataPeriod && rankings.length > 0 && (
        <div className="data-period-notice" style={{
          padding: '10px 16px',
          marginBottom: '16px',
          background: 'rgba(179, 144, 92, 0.1)',
          border: '1px solid rgba(179, 144, 92, 0.3)',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#B3905C',
        }}>
          📊 Showing rankings through <strong>{dataPeriod}</strong> (most recent available data)
        </div>
      )}

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
