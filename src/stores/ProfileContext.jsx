import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'phoenix_trader_profile'

const DEFAULT_PROFILE = {
  riskTolerance: 7,
  preferredHoldDuration: 'swing',
  capitalRange: '10k-50k',
  experienceLevel: 'advanced',
  emotionalProfile: 'analytical',
  preferredMarkets: 'futures',
  maxDrawdownTolerance: 15,
  tradingSchedule: 'parttime',
  summary: 'An advanced futures trader focused on swing timeframes with moderate-to-high risk tolerance.',
}

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [profile, setProfileState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : DEFAULT_PROFILE
    } catch {
      return DEFAULT_PROFILE
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [profile])

  const setProfile = useCallback((update) => {
    setProfileState((prev) => {
      const next = typeof update === 'function' ? update(prev) : { ...prev, ...update }
      return next
    })
  }, [])

  const resetProfile = useCallback(() => setProfileState(DEFAULT_PROFILE), [])

  return (
    <ProfileContext.Provider value={{ profile, setProfile, resetProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be inside ProfileProvider')
  return ctx
}
