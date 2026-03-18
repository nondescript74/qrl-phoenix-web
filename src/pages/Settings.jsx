import { useState, useRef } from 'react'
import { useProfile } from '../stores/ProfileContext'
import { useEventLog } from '../stores/EventLogContext'
import { healthCheck } from '../api/phoenix'

const PROFILE_FIELDS = [
  { key: 'riskTolerance', label: 'Risk Tolerance (1-10)', type: 'number', min: 1, max: 10 },
  { key: 'preferredHoldDuration', label: 'Hold Duration', type: 'select', options: ['scalp', 'daytrader', 'swing', 'position'] },
  { key: 'capitalRange', label: 'Capital Range', type: 'select', options: ['<10k', '10k-50k', '50k-200k', '200k-1M', '>1M'] },
  { key: 'experienceLevel', label: 'Experience', type: 'select', options: ['beginner', 'intermediate', 'advanced', 'professional'] },
  { key: 'emotionalProfile', label: 'Emotional Profile', type: 'select', options: ['analytical', 'impulsive', 'cautious', 'aggressive'] },
  { key: 'preferredMarkets', label: 'Markets', type: 'select', options: ['options', 'futures', 'equities', 'crypto', 'forex'] },
  { key: 'maxDrawdownTolerance', label: 'Max Drawdown %', type: 'number', min: 1, max: 50 },
  { key: 'tradingSchedule', label: 'Schedule', type: 'select', options: ['fulltime', 'parttime', 'occasional'] },
  { key: 'summary', label: 'Summary', type: 'textarea' },
]

export default function Settings() {
  const { profile, setProfile, resetProfile } = useProfile()
  const { events, appendEvent } = useEventLog()
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('phoenix_api_url') || '')
  const [healthStatus, setHealthStatus] = useState(null)
  const fileRef = useRef(null)

  // IASG Credentials (localStorage — not as secure as iOS Keychain, but functional)
  const [iasgEmail, setIasgEmail] = useState(localStorage.getItem('phoenix_iasg_email') || '')
  const [iasgPassword, setIasgPassword] = useState(localStorage.getItem('phoenix_iasg_password') || '')
  const [iasgSaved, setIasgSaved] = useState(false)
  const [iasgTestStatus, setIasgTestStatus] = useState(null)
  const [iasgTesting, setIasgTesting] = useState(false)

  function saveIasgCredentials() {
    if (iasgEmail.trim()) {
      localStorage.setItem('phoenix_iasg_email', iasgEmail.trim())
    } else {
      localStorage.removeItem('phoenix_iasg_email')
    }
    if (iasgPassword) {
      localStorage.setItem('phoenix_iasg_password', iasgPassword)
    } else {
      localStorage.removeItem('phoenix_iasg_password')
    }
    setIasgSaved(true)
    setTimeout(() => setIasgSaved(false), 2000)
  }

  function clearIasgCredentials() {
    localStorage.removeItem('phoenix_iasg_email')
    localStorage.removeItem('phoenix_iasg_password')
    setIasgEmail('')
    setIasgPassword('')
    setIasgSaved(false)
    setIasgTestStatus(null)
  }

  async function testIasgCredentials() {
    const email = iasgEmail.trim() || localStorage.getItem('phoenix_iasg_email')
    const password = iasgPassword || localStorage.getItem('phoenix_iasg_password')
    if (!email || !password) {
      setIasgTestStatus({ ok: false, message: 'Enter both email and password first' })
      return
    }
    setIasgTesting(true)
    setIasgTestStatus(null)
    try {
      const baseUrl = localStorage.getItem('phoenix_api_url') || 'https://web-production-63a4f.up.railway.app'
      const res = await fetch(`${baseUrl}/iasg/test-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(30000),
      })
      if (res.ok) {
        const data = await res.json()
        setIasgTestStatus({ ok: true, message: data.message || 'Credentials verified' })
      } else if (res.status === 401) {
        setIasgTestStatus({ ok: false, message: 'Invalid credentials — check email and password' })
      } else if (res.status === 404) {
        // Endpoint not yet on backend — fall back to a simple validation check
        setIasgTestStatus({ ok: null, message: 'Credentials saved — backend verification endpoint not yet available' })
      } else {
        setIasgTestStatus({ ok: false, message: `Server error (${res.status})` })
      }
    } catch (err) {
      if (err.name === 'TimeoutError') {
        setIasgTestStatus({ ok: false, message: 'Request timed out' })
      } else {
        setIasgTestStatus({ ok: null, message: 'Credentials saved — could not reach backend to verify' })
      }
    } finally {
      setIasgTesting(false)
    }
  }

  function handleProfileChange(key, value) {
    setProfile({ [key]: key === 'riskTolerance' || key === 'maxDrawdownTolerance' ? Number(value) : value })
  }

  function saveApiUrl() {
    if (apiUrl.trim()) {
      localStorage.setItem('phoenix_api_url', apiUrl.trim())
    } else {
      localStorage.removeItem('phoenix_api_url')
    }
    setHealthStatus(null)
  }

  async function checkHealth() {
    try {
      const res = await healthCheck()
      setHealthStatus({ ok: true, data: res })
    } catch (err) {
      setHealthStatus({ ok: false, error: err.message })
    }
  }

  function exportProfile() {
    const data = { profile, events, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `phoenix-profile-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importProfile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.profile) {
          setProfile(data.profile)
          appendEvent('PROFILE_EXCHANGE', { action: 'import', source: file.name })
        }
      } catch {
        alert('Invalid profile JSON file.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="page settings-page">
      <h1>Settings</h1>

      <section className="settings-section">
        <h2>Trader Profile</h2>
        <div className="profile-form">
          {PROFILE_FIELDS.map((f) => (
            <div key={f.key} className="form-field">
              <label>{f.label}</label>
              {f.type === 'select' ? (
                <select value={profile[f.key] || ''} onChange={(e) => handleProfileChange(f.key, e.target.value)}>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea
                  value={profile[f.key] || ''}
                  onChange={(e) => handleProfileChange(f.key, e.target.value)}
                  rows={3}
                />
              ) : (
                <input
                  type={f.type}
                  min={f.min}
                  max={f.max}
                  value={profile[f.key] || ''}
                  onChange={(e) => handleProfileChange(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        <div className="profile-actions">
          <button className="btn-secondary" onClick={resetProfile}>Reset to Default</button>
          <button className="btn-primary" onClick={exportProfile}>Export Profile</button>
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}>Import Profile</button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importProfile} />
        </div>
      </section>

      <section className="settings-section">
        <h2>IASG Credentials</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #8899aa)', marginBottom: '1rem' }}>
          Your IASG account credentials for accessing CTA rankings. Stored locally in your browser.
        </p>
        <div className="profile-form">
          <div className="form-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={iasgEmail}
              onChange={(e) => setIasgEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="form-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={iasgPassword}
              onChange={(e) => setIasgPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
        </div>
        <div className="profile-actions">
          <button className="btn-primary" onClick={saveIasgCredentials}>
            {iasgSaved ? '✓ Saved' : 'Save Credentials'}
          </button>
          <button className="btn-primary" onClick={testIasgCredentials} disabled={iasgTesting}>
            {iasgTesting ? 'Testing…' : 'Test Credentials'}
          </button>
          <button className="btn-secondary" onClick={clearIasgCredentials}>Clear</button>
        </div>
        {iasgTestStatus && (
          <div className={`health-status ${iasgTestStatus.ok === true ? 'healthy' : iasgTestStatus.ok === false ? 'unhealthy' : ''}`}
               style={iasgTestStatus.ok === null ? { background: 'rgba(179,142,92,0.15)', color: '#B38E5C', border: '1px solid rgba(179,142,92,0.3)' } : {}}>
            {iasgTestStatus.message}
          </div>
        )}
      </section>

      <section className="settings-section">
        <h2>API Configuration</h2>
        <div className="form-field">
          <label>Backend URL (leave blank for default)</label>
          <div className="api-row">
            <input
              type="url"
              placeholder="https://web-production-63a4f.up.railway.app"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
            <button className="btn-secondary" onClick={saveApiUrl}>Save</button>
            <button className="btn-primary" onClick={checkHealth}>Test</button>
          </div>
        </div>
        {healthStatus && (
          <div className={`health-status ${healthStatus.ok ? 'healthy' : 'unhealthy'}`}>
            {healthStatus.ok
              ? `Connected — ${healthStatus.data?.service} v${healthStatus.data?.version}`
              : `Error: ${healthStatus.error}`}
          </div>
        )}
      </section>
    </div>
  )
}
