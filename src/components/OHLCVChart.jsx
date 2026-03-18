import { useRef, useEffect } from 'react'

function drawChart(canvas, bars, sweetZone) {
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, w, h)

  if (!bars || bars.length === 0) return

  const pad = { top: 12, right: 8, bottom: 24, left: 52 }
  const cw = w - pad.left - pad.right
  const ch = h - pad.top - pad.bottom

  const highs = bars.map((b) => b.high)
  const lows = bars.map((b) => b.low)
  const maxP = Math.max(...highs)
  const minP = Math.min(...lows)
  const range = maxP - minP || 1

  const barW = Math.max(1, (cw / bars.length) * 0.6)
  const gap = cw / bars.length

  // sweet zone shading
  if (sweetZone?.zone_periods) {
    sweetZone.zone_periods.forEach((zp) => {
      if (!zp.in_zone) return
      const si = bars.findIndex((b) => b.date >= zp.start_date)
      const ei = bars.findIndex((b) => b.date > zp.end_date)
      const startX = si >= 0 ? pad.left + si * gap : pad.left
      const endX = ei >= 0 ? pad.left + ei * gap : pad.left + cw
      ctx.fillStyle = 'rgba(76, 175, 80, 0.08)'
      ctx.fillRect(startX, pad.top, endX - startX, ch)
    })
  }

  // grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (ch / 4) * i
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(pad.left + cw, y)
    ctx.stroke()
    const price = maxP - (range / 4) * i
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '10px Inter'
    ctx.textAlign = 'right'
    ctx.fillText(price.toFixed(price > 100 ? 0 : 2), pad.left - 4, y + 3)
  }

  // candlesticks
  bars.forEach((bar, i) => {
    const x = pad.left + i * gap + gap / 2
    const oY = pad.top + ((maxP - bar.open) / range) * ch
    const cY = pad.top + ((maxP - bar.close) / range) * ch
    const hY = pad.top + ((maxP - bar.high) / range) * ch
    const lY = pad.top + ((maxP - bar.low) / range) * ch
    const bullish = bar.close >= bar.open
    const color = bullish ? '#4CAF50' : '#EF5350'

    // wick
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, hY)
    ctx.lineTo(x, lY)
    ctx.stroke()

    // body
    ctx.fillStyle = color
    const bodyTop = Math.min(oY, cY)
    const bodyH = Math.max(Math.abs(cY - oY), 1)
    ctx.fillRect(x - barW / 2, bodyTop, barW, bodyH)
  })

  // date labels
  const labelCount = Math.min(5, bars.length)
  const step = Math.floor(bars.length / labelCount)
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = '9px Inter'
  ctx.textAlign = 'center'
  for (let i = 0; i < bars.length; i += step) {
    const x = pad.left + i * gap + gap / 2
    const d = bars[i].date?.slice(5, 10) || ''
    ctx.fillText(d, x, h - 4)
  }
}

export default function OHLCVChart({ bars, sweetZone, label }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) drawChart(ref.current, bars, sweetZone)
  }, [bars, sweetZone])

  useEffect(() => {
    const obs = new ResizeObserver(() => {
      if (ref.current) drawChart(ref.current, bars, sweetZone)
    })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [bars, sweetZone])

  return (
    <div className="ohlcv-chart-wrap">
      {label && <div className="ohlcv-label">{label}</div>}
      <canvas ref={ref} className="ohlcv-canvas" />
    </div>
  )
}
