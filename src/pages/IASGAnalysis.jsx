import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { analyzeIASG } from '../api/phoenix'
import { useProfile } from '../stores/ProfileContext'
import { useEventLog } from '../stores/EventLogContext'
import MatchScoreCircle from '../components/MatchScoreCircle'
import InstrumentChartCard from '../components/InstrumentChartCard'
import TagPill from '../components/TagPill'
import ConflictPill from '../components/ConflictPill'
import Spinner from '../components/Spinner'

export default function IASGAnalysis() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { appendEvent } = useEventLog()
  const ranking = location.state?.ranking

  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!ranking) return
    setLoading(true)
    analyzeIASG({
      rank: ranking.rank,
      group_name: ranking.group_name,
      program_name: ranking.program_name,
      program_url: ranking.program_url,
      performance: ranking.performance,
      inception_date: ranking.inception_date,
      trader_profile: profile,
    })
      .then((data) => {
        setAnalysis(data)
        appendEvent('STRATEGY_ANALYSIS', {
          program: ranking.program_name,
          score: data.profile_match?.score,
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [ranking])

  if (!ranking) {
    return (
      <div className="page">
        <p>No ranking selected.</p>
        <button className="btn-secondary" onClick={() => navigate('/iasg')}>Back to Rankings</button>
      </div>
    )
  }

  if (loading) return <Spinner text={`Analyzing ${ranking.program_name}... This may take up to 4 minutes.`} />
  if (error) return <div className="page"><div className="page-error">{error}</div><button className="btn-secondary" onClick={() => navigate('/iasg')}>Back</button></div>

  if (!analysis) return null

  const { research, profile_match, instruments_data, conclusion } = analysis

  return (
    <div className="page analysis-page">
      <button className="btn-back" onClick={() => navigate('/iasg')}>← Back to Rankings</button>

      <div className="analysis-header">
        <div>
          <h1>{ranking.program_name}</h1>
          <p className="analysis-group">{ranking.group_name} — Rank #{ranking.rank}</p>
        </div>
        {profile_match && <MatchScoreCircle score={profile_match.score} size={80} />}
      </div>

      {research && (
        <section className="analysis-section">
          <h2>Research</h2>
          <div className="research-meta">
            <TagPill label={research.strategy_type} variant="instrument" />
            {research.aum_range && <TagPill label={`AUM: ${research.aum_range}`} />}
            {research.min_investment && <TagPill label={`Min: ${research.min_investment}`} />}
          </div>
          <p>{research.description}</p>
          <p><strong>Instruments:</strong> {research.instruments?.join(', ')}</p>
          <p><strong>Market Conditions:</strong> {research.market_conditions}</p>
        </section>
      )}

      {profile_match && (
        <section className="analysis-section">
          <h2>Profile Match</h2>
          <div className="match-details">
            <div className="match-score-large">
              <MatchScoreCircle score={profile_match.score} size={100} />
              <span className={profile_match.recommended ? 'recommended-badge' : 'not-recommended-badge'}>
                {profile_match.recommended ? 'Recommended' : 'Not Recommended'}
              </span>
            </div>
            <div className="match-reasons">
              <h4>Match Reasons</h4>
              <ul>
                {profile_match.reasons?.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
              {profile_match.conflicts?.length > 0 && (
                <div className="match-conflicts">
                  <h4>Conflicts</h4>
                  {profile_match.conflicts.map((c, i) => (
                    <ConflictPill key={i} severity={c.severity} message={c.message} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {instruments_data?.length > 0 && (
        <section className="analysis-section">
          <h2>Market Data & Sweet Zone Analysis</h2>
          <div className="instruments-grid">
            {instruments_data.map((inst, i) => (
              <InstrumentChartCard key={i} instrument={inst} />
            ))}
          </div>
        </section>
      )}

      {conclusion && (
        <section className="analysis-section conclusion-section">
          <h2>Conclusion</h2>
          <p className="conclusion-text">{conclusion}</p>
          {analysis.research_confidence && (
            <p className="confidence">Research Confidence: {analysis.research_confidence}/5</p>
          )}
        </section>
      )}
    </div>
  )
}
