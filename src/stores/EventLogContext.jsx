import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'phoenix_event_chain'

const EventLogContext = createContext(null)

async function sha256(message) {
  const data = new TextEncoder().encode(message)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function EventLogProvider({ children }) {
  const [events, setEvents] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  }, [events])

  const appendEvent = useCallback(async (type, payload) => {
    const prevHash = events.length > 0 ? events[events.length - 1].hash : '0'.repeat(64)
    const timestamp = new Date().toISOString()
    const raw = JSON.stringify({ type, payload, timestamp, prevHash })
    const hash = await sha256(raw)
    const event = { type, payload, timestamp, prevHash, hash, index: events.length }
    setEvents((prev) => [...prev, event])
    return event
  }, [events])

  const verifyChain = useCallback(async () => {
    for (let i = 0; i < events.length; i++) {
      const e = events[i]
      const expectedPrev = i === 0 ? '0'.repeat(64) : events[i - 1].hash
      if (e.prevHash !== expectedPrev) return { valid: false, brokenAt: i }
      const raw = JSON.stringify({ type: e.type, payload: e.payload, timestamp: e.timestamp, prevHash: e.prevHash })
      const computed = await sha256(raw)
      if (computed !== e.hash) return { valid: false, brokenAt: i }
    }
    return { valid: true }
  }, [events])

  const clearEvents = useCallback(() => setEvents([]), [])

  return (
    <EventLogContext.Provider value={{ events, appendEvent, verifyChain, clearEvents }}>
      {children}
    </EventLogContext.Provider>
  )
}

export function useEventLog() {
  const ctx = useContext(EventLogContext)
  if (!ctx) throw new Error('useEventLog must be inside EventLogProvider')
  return ctx
}
