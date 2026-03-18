const DEFAULT_BASE = 'https://web-production-63a4f.up.railway.app'

function getBase() {
  return localStorage.getItem('phoenix_api_url') || DEFAULT_BASE
}

async function request(path, { method = 'GET', body, timeout = 120000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(`${getBase()}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`${res.status}: ${text}`)
    }
    return res.json()
  } finally {
    clearTimeout(timer)
  }
}

export function healthCheck() {
  return request('/health')
}

export function fetchStrategies() {
  return request('/strategies/mock')
}

export function discoverStrategies(traderProfile) {
  return request('/strategies/discover', {
    method: 'POST',
    body: { trader_profile: traderProfile },
    timeout: 180000,
  })
}

export function analyzeIASG(params) {
  return request('/strategies/analyze-iasg', {
    method: 'POST',
    body: params,
    timeout: 240000,
  })
}

export function analyzeWeb(params) {
  return request('/strategies/analyze-web', {
    method: 'POST',
    body: params,
    timeout: 240000,
  })
}

export function evaluateCTAs(rankings, topN = 20) {
  return request('/strategies/evaluate', {
    method: 'POST',
    body: { rankings, top_n: topN },
    timeout: 300000,
  })
}

export function coachSession({ mode, messages, strategySchema, traderProfile }) {
  return request('/coach/session', {
    method: 'POST',
    body: {
      mode,
      messages,
      strategy_schema: strategySchema || undefined,
      trader_profile: traderProfile || undefined,
    },
    timeout: 120000,
  })
}

export function fetchIASGRankings(month, year, credentials) {
  return request('/iasg/rankings', {
    method: 'POST',
    body: { month, year, ...(credentials || {}) },
    timeout: 60000,
  })
}

export function testIASGCredentials(email, password) {
  return request('/iasg/test-credentials', {
    method: 'POST',
    body: { email, password },
    timeout: 30000,
  })
}

export function fetchMarketOHLCV(symbol, start, end) {
  return request(`/market/ohlcv/${symbol}?start=${start}&end=${end}`)
}

export function fetchInstruments() {
  return request('/market/instruments')
}
