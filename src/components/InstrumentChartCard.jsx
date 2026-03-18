import OHLCVChart from './OHLCVChart'
import SweetZoneGauge from './SweetZoneGauge'
import TagPill from './TagPill'

export default function InstrumentChartCard({ instrument }) {
  const d = instrument
  const sz = d.sweet_zone

  return (
    <div className="instrument-card">
      <div className="ic-header">
        <h4 className="ic-symbol">{d.display_name || d.symbol}</h4>
        {sz && (
          <TagPill
            label={sz.zone_label || sz.zone_status}
            variant={sz.zone_status === 'favorable' ? 'green' : sz.zone_status === 'unfavorable' ? 'risk' : 'default'}
          />
        )}
      </div>

      {d.ohlcv_6mo?.length > 0 && (
        <OHLCVChart bars={d.ohlcv_6mo} sweetZone={sz} label="6-Month" />
      )}
      {d.ohlcv_3mo?.length > 0 && (
        <OHLCVChart bars={d.ohlcv_3mo} sweetZone={sz} label="3-Month" />
      )}

      {sz && (
        <div className="ic-gauges">
          <SweetZoneGauge label="Trend Strength" value={sz.trend_strength} />
          <SweetZoneGauge label="Volatility %ile" value={sz.volatility_percentile} />
          <SweetZoneGauge label="Mean Rev." value={sz.mean_reversion_score} max={1} format={(v) => v.toFixed(2)} />
        </div>
      )}
    </div>
  )
}
