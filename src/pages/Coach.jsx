import { useState, useRef, useEffect } from 'react'
import { coachSession } from '../api/phoenix'
import { useProfile } from '../stores/ProfileContext'
import { useEventLog } from '../stores/EventLogContext'
import MessageBubble from '../components/MessageBubble'
import TypingIndicator from '../components/TypingIndicator'

const MODES = [
  { key: 'risk_profiler', label: 'Risk Profiler', desc: 'Build your trader profile through guided conversation' },
  { key: 'strategy_explainer', label: 'Strategy Explainer', desc: 'Analyze and explain a strategy in plain English' },
  { key: 'strategy_builder', label: 'Strategy Builder', desc: 'Build a new strategy schema step by step' },
  { key: 'strategy_mapper', label: 'Strategy Mapper', desc: 'Describe a strategy and map it to recognized categories' },
]

function StrategyMappingCard({ mapping }) {
  const mappings = mapping.strategy_mappings || []
  const edge = mapping.edge_analysis || {}
  const instruments = mapping.instruments || {}
  const conditions = mapping.market_conditions || {}

  return (
    <div style={{
      margin: '12px 0', padding: '20px', borderRadius: '12px',
      background: 'linear-gradient(135deg, rgba(0,26,54,0.95), rgba(0,40,80,0.9))',
      border: '1px solid rgba(179,144,92,0.3)', color: '#e2e8f0'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, color: '#B3905C', fontSize: '14px', letterSpacing: '1.5px' }}>
          STRATEGY MAPPING — {(mapping.trader_name || 'Unknown').toUpperCase()}
        </h3>
        <span style={{
          background: 'rgba(179,144,92,0.2)', color: '#B3905C', padding: '3px 10px',
          borderRadius: '6px', fontSize: '11px', fontWeight: 700
        }}>
          {mapping.primary_classification?.replace(/_/g, ' ').toUpperCase()}
        </span>
      </div>

      {mapping.strategy_summary && (
        <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '16px', lineHeight: 1.5 }}>
          {mapping.strategy_summary}
        </p>
      )}

      {/* Category Rankings */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', marginBottom: '8px' }}>
          CATEGORY MAPPINGS
        </h4>
        {mappings.map((m, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#B3905C', width: '20px' }}>
              #{m.rank}
            </span>
            <span style={{
              fontSize: '11px', fontWeight: 600, color: '#e2e8f0', width: '120px'
            }}>
              {m.category?.replace(/_/g, ' ')}
            </span>
            <div style={{
              flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px'
            }}>
              <div style={{
                width: `${(m.relevance_score || 0) * 100}%`, height: '100%',
                background: m.relevance_score > 0.8 ? '#22c55e' : m.relevance_score > 0.6 ? '#B3905C' : '#64748b',
                borderRadius: '3px', transition: 'width 0.5s ease'
              }} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, width: '36px', textAlign: 'right' }}>
              {((m.relevance_score || 0) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      {/* Edge + Instruments grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {edge.source && (
          <div style={{
            padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <h4 style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1px', margin: '0 0 4px' }}>EDGE SOURCE</h4>
            <p style={{ fontSize: '11px', margin: 0, lineHeight: 1.4 }}>{edge.source}</p>
          </div>
        )}
        {instruments.asset_classes && (
          <div style={{
            padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <h4 style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1px', margin: '0 0 4px' }}>INSTRUMENTS</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {[...(instruments.asset_classes || []), ...(instruments.specific || [])].map((inst, i) => (
                <span key={i} style={{
                  fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                  background: 'rgba(179,144,92,0.15)', color: '#B3905C'
                }}>{inst}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Market Conditions */}
      {(conditions.thrives_in || conditions.vulnerable_to) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {conditions.thrives_in && (
            <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <h4 style={{ fontSize: '10px', color: '#22c55e', letterSpacing: '1px', margin: '0 0 4px' }}>THRIVES IN</h4>
              {conditions.thrives_in.map((c, i) => (
                <p key={i} style={{ fontSize: '10px', margin: '2px 0', opacity: 0.85 }}>• {c}</p>
              ))}
            </div>
          )}
          {conditions.vulnerable_to && (
            <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <h4 style={{ fontSize: '10px', color: '#ef4444', letterSpacing: '1px', margin: '0 0 4px' }}>VULNERABLE TO</h4>
              {conditions.vulnerable_to.map((c, i) => (
                <p key={i} style={{ fontSize: '10px', margin: '2px 0', opacity: 0.85 }}>• {c}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Coach() {
  const { profile, setProfile } = useProfile()
  const { appendEvent } = useEventLog()
  const [mode, setMode] = useState('risk_profiler')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [strategySchema, setStrategySchema] = useState(null)
  const [strategyMapping, setStrategyMapping] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  function resetSession() {
    setMessages([])
    setStrategySchema(null)
    setStrategyMapping(null)
  }

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await coachSession({
        mode,
        messages: updated,
        strategySchema,
        traderProfile: profile,
      })

      if (res.error) {
        setMessages([...updated, { role: 'assistant', content: `Error: ${res.error}` }])
      } else {
        if (res.reply) {
          setMessages([...updated, { role: 'assistant', content: res.reply }])
        }
        if (res.extracted_profile) {
          setProfile(res.extracted_profile)
          appendEvent('PROFILE_CAPTURED', res.extracted_profile)
        }
        if (res.extracted_schema) {
          setStrategySchema(res.extracted_schema)
        }
        if (res.extracted_mapping) {
          setStrategyMapping(res.extracted_mapping)
        }
      }
    } catch (err) {
      setMessages([...updated, { role: 'assistant', content: `Connection error: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function exportPDF() {
    const text = messages.map((m) => `[${m.role}]\n${m.content}`).join('\n\n---\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `phoenix-coach-${mode}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page coach-page">
      <div className="coach-sidebar">
        <h2 className="sidebar-title">Coach Mode</h2>
        {MODES.map((m) => (
          <button
            key={m.key}
            className={`mode-btn${mode === m.key ? ' active' : ''}`}
            onClick={() => { setMode(m.key); resetSession() }}
          >
            <strong>{m.label}</strong>
            <span className="mode-desc">{m.desc}</span>
          </button>
        ))}
        <div className="sidebar-actions">
          <button className="btn-secondary" onClick={resetSession}>New Session</button>
          {messages.length > 0 && (
            <button className="btn-secondary" onClick={exportPDF}>Export</button>
          )}
        </div>
      </div>

      <div className="coach-main">
        <div className="chat-messages" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="chat-empty">
              <h3>{MODES.find((m) => m.key === mode)?.label}</h3>
              <p>{MODES.find((m) => m.key === mode)?.desc}</p>
              <p className="chat-hint">Type a message to begin.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
          {strategyMapping && <StrategyMappingCard mapping={strategyMapping} />}
          {loading && <TypingIndicator />}
        </div>

        <div className="chat-input-bar">
          <textarea
            className="chat-input"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={loading}
          />
          <button className="btn-send" onClick={send} disabled={loading || !input.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
