import {
  BaselineSeries,
  ColorType,
  createChart,
  LineStyle,
  TickMarkType,
} from 'lightweight-charts'
import type { IChartApi, IPriceLine, ISeriesApi, Time, UTCTimestamp } from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'

/** Horizontal markers for user price alerts */
export type ChartAlertLevel = {
  id: number
  targetPrice: number
  condition: string
}

/** US equities session labels (matches market logic elsewhere). */
const US_STOCK_TZ = 'America/New_York'

function formatAxisTick(time: Time, tickMarkType: TickMarkType, locale: string): string | null {
  if (tickMarkType === TickMarkType.Year || tickMarkType === TickMarkType.Month || tickMarkType === TickMarkType.DayOfMonth) {
    return null
  }
  if (typeof time !== 'number') return null
  const d = new Date(time * 1000)
  const minute = Number(
    new Intl.DateTimeFormat(locale, {
      timeZone: US_STOCK_TZ,
      minute: 'numeric',
    })
      .formatToParts(d)
      .find((p) => p.type === 'minute')?.value ?? '0',
  )
  // On-the-hour marks: label with hour only; otherwise hour + minute (no seconds).
  if (minute === 0) {
    return d.toLocaleTimeString(locale, {
      timeZone: US_STOCK_TZ,
      hour: 'numeric',
      hour12: true,
    })
  }
  return d.toLocaleTimeString(locale, {
    timeZone: US_STOCK_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatCrosshairTime(time: Time): string {
  if (typeof time !== 'number') return ''
  return new Date(time * 1000).toLocaleTimeString(undefined, {
    timeZone: US_STOCK_TZ,
    hour: 'numeric',
    minute: '2-digit',
    second: undefined,
    hour12: true,
  })
}

/** Midpoint between the lowest and highest price in the series (horizontal baseline). */
export function computeMidRangeBaseline(data: { value: number }[]): number {
  if (data.length === 0) return 0
  let min = Infinity
  let max = -Infinity
  for (const p of data) {
    if (p.value < min) min = p.value
    if (p.value > max) max = p.value
  }
  return (min + max) / 2
}

type ChartProps = {
  data: { time: number; value: number }[]
  /** Price levels for alert thresholds (current symbol only). */
  alertLevels?: ChartAlertLevel[]
  colors?: {
    backgroundColor?: string
    textColor?: string
    /** Line & fill when price is above the baseline */
    riseColor?: string
    /** Line & fill when price is below the baseline */
    dipColor?: string
  }
}

const ALERT_LINE_COLOR = 'rgba(234, 179, 8, 0.9)'
const HOVER_PX = 14

export function ChartComponent(props: ChartProps) {
  const {
    data,
    alertLevels = [],
    colors: {
      backgroundColor = 'transparent',
      textColor = '#D9D9D9',
      riseColor = '#22c55e',
      dipColor = '#ef4444',
    } = {},
  } = props

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Baseline'> | null>(null)
  const priceLineRefs = useRef<IPriceLine[]>([])
  const alertLevelsRef = useRef(alertLevels)
  alertLevelsRef.current = alertLevels

  const [lineTooltip, setLineTooltip] = useState<{
    left: number
    top: number
    items: { id: number; text: string }[]
  } | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      grid: {
        vertLines: { color: 'rgba(197, 203, 206, 0.1)' },
        horzLines: { color: 'rgba(197, 203, 206, 0.1)' },
      },
      localization: {
        timeFormatter: formatCrosshairTime,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        /** Default is false: axis would show date only for same-day intraday data. */
        timeVisible: true,
        /** Default is true for intraday: axis/crosshair show seconds; we want hour/minute steps. */
        secondsVisible: false,
        tickMarkFormatter: formatAxisTick,
      },
    })

    const series = chart.addSeries(BaselineSeries, {
      baseValue: { type: 'price', price: 0 },
      relativeGradient: false,
      lineWidth: 2,
      topLineColor: riseColor,
      bottomLineColor: dipColor,
      topFillColor1: 'rgba(34, 197, 94, 0.32)',
      topFillColor2: 'rgba(34, 197, 94, 0.04)',
      bottomFillColor1: 'rgba(239, 68, 68, 0.04)',
      bottomFillColor2: 'rgba(239, 68, 68, 0.28)',
      lastValueVisible: true,
      priceLineVisible: true,
      crosshairMarkerVisible: true,
    })

    chartRef.current = chart
    seriesRef.current = series

    const crosshairHandler = (param: {
      point?: { x: number; y: number }
    }) => {
      const s = seriesRef.current
      if (!param.point || !s) {
        setLineTooltip(null)
        return
      }
      const levels = alertLevelsRef.current
      if (!levels.length) {
        setLineTooltip(null)
        return
      }
      const { x, y } = param.point
      const hits: ChartAlertLevel[] = []
      for (const level of levels) {
        const lineY = s.priceToCoordinate(level.targetPrice)
        if (lineY === null) continue
        if (Math.abs(y - lineY) <= HOVER_PX) {
          hits.push(level)
        }
      }
      if (hits.length === 0) {
        setLineTooltip(null)
        return
      }
      const anchorY = s.priceToCoordinate(hits[0].targetPrice) ?? y
      const items = hits.map((h) => ({
        id: h.id,
        text: `${h.condition === 'above' ? 'Above' : 'Below'} $${h.targetPrice.toFixed(2)} · alert #${h.id}`,
      }))
      setLineTooltip({
        left: x,
        top: anchorY,
        items,
      })
    }

    chart.subscribeCrosshairMove(crosshairHandler)

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      chart.unsubscribeCrosshairMove(crosshairHandler)
      window.removeEventListener('resize', handleResize)
      priceLineRefs.current = []
      setLineTooltip(null)
      chart.remove()
    }
  }, [backgroundColor, textColor, riseColor, dipColor])

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return

    if (!data?.length) {
      seriesRef.current.setData([])
      return
    }

    const baseline = computeMidRangeBaseline(data)
    seriesRef.current.applyOptions({
      baseValue: { type: 'price', price: baseline },
    })

    const points = data.map((p) => ({
      time: p.time as UTCTimestamp,
      value: p.value,
    }))

    seriesRef.current.setData(points)
    chartRef.current.timeScale().fitContent()
  }, [data])

  useEffect(() => {
    const series = seriesRef.current
    if (!series) return

    for (const line of priceLineRefs.current) {
      series.removePriceLine(line)
    }
    priceLineRefs.current = []

    for (const level of alertLevels) {
      const pl = series.createPriceLine({
        price: level.targetPrice,
        color: ALERT_LINE_COLOR,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        lineVisible: true,
        axisLabelVisible: true,
        title: `${level.condition === 'above' ? '≥' : '≤'} $${level.targetPrice.toFixed(2)}`,
      })
      priceLineRefs.current.push(pl)
    }
  }, [alertLevels, data])

  return (
    <div className="relative h-full w-full">
      <div ref={chartContainerRef} className="h-full w-full" />
      {lineTooltip && (
        <div
          className="pointer-events-none absolute z-20 max-w-xs rounded-lg border border-border bg-popover/95 px-2.5 py-2 text-xs text-popover-foreground shadow-lg backdrop-blur-sm"
          style={{
            left: lineTooltip.left + 10,
            top: lineTooltip.top,
            transform: 'translateY(calc(-100% - 6px))',
          }}
        >
          <p className="font-medium text-foreground">Alert threshold</p>
          <ul className="mt-1 space-y-0.5 text-muted-foreground">
            {lineTooltip.items.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
