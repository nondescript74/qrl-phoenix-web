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
]

export default function Coach() {
  const { profile, setProfile } = useProfile()
  const { appendEvent } = useEventLog()
  const [mode, setMode] = useState('risk_profiler')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [strategySchema, setStrategySchema] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  function resetSession() {
    setMessages([])
    setStrategySchema(null)
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
