import { useState, useRef, useId } from 'react'

/* ChartFrame — presentational chart family driven entirely by the chart
 * palette tokens (--k-chart-1 … --k-chart-6). Pure SVG, no chart library:
 * the point is to PROVE the generated palette reads well across the shapes a
 * real product dashboard actually ships (line, area, bar, stacked bar, stacked
 * area, donut) — now at SaaS grade: gridlines, y/x axes, a hover tooltip with a
 * tracking cursor, and a labelled donut. Series colours cycle through the six
 * palette slots, so whatever the user picks for "Chart palette" flows in.
 *
 * Why SVG and not Recharts: UIcockpit exports framework-neutral TOKENS, never
 * React component code. A charting lib can't ship in the export and is React-
 * only; the BRIEF/AI-prompt instead documents how --k-chart-1..6 maps onto any
 * chart lib (Recharts/Chart.js/visx). This component is the live proof. */

export type ChartType = 'line' | 'area' | 'bar' | 'stacked' | 'stackedArea' | 'donut'

export interface ChartSeries {
  name: string
  values: number[]
}

interface ChartFrameProps {
  type: ChartType
  series: ChartSeries[]
  labels?: string[]
  height?: number
  showLegend?: boolean
}

const chartVar = (i: number) => `var(--k-chart-${(i % 6) + 1})`
// Non-colour channel for line series (WCAG 1.4.1 SC, colour-blind) — a dash
// pattern cycles per series so lines stay distinguishable even when the chart
// palette is a user-chosen single hue. solid → dash → dot → dash-dot → …
const chartDash = (i: number) => ['none', '7 4', '2 4', '10 3 2 3', '1 5', '14 5'][i % 6]

const W = 320
const H = 150
const PAD = 6

/** "Nice" axis ceiling — round the data max up to the next multiple of its
 *  leading power of ten, so 72→80, 48→50, 720→800. Keeps the y-ticks clean
 *  (0 / 40 / 80) while letting the marks fill most of the plot height. */
function niceMax(raw: number): number {
  if (raw <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  return Math.ceil(raw / pow) * pow
}

export function ChartFrame({ type, series, labels, height = H, showLegend = true }: ChartFrameProps) {
  // Hovered column index (cartesian) — drives the cursor + tooltip.
  const [hover, setHover] = useState<number | null>(null)
  // Unique-per-instance id for the area gradient defs (colons stripped so the
  // url(#…) reference is valid). Multiple ChartFrames can render on one page.
  const uid = useId().replace(/:/g, '')
  const cartesian = type !== 'donut'

  const cols = labels?.length ?? series[0]?.values.length ?? 0
  // Grouped charts scale to the largest single value; stacked charts to the
  // largest column total.
  const stacked = type === 'stacked' || type === 'stackedArea'
  const rawMax = stacked
    ? Math.max(1, ...Array.from({ length: cols }, (_, ci) => series.reduce((s, ser) => s + (ser.values[ci] ?? 0), 0)))
    : Math.max(1, ...series.flatMap((s) => s.values))
  const max = niceMax(rawMax)

  // Map a column index → horizontal % for the cursor/tooltip. Point charts sit
  // ON the gridline (i/(n-1)); bar charts sit at the band centre.
  const colPct = (i: number) => {
    if (cols <= 1) return 50
    const pointed = type === 'line' || type === 'area' || type === 'stackedArea'
    const inner = ((W - PAD * 2) * (pointed ? i / (cols - 1) : (i + 0.5) / cols) + PAD) / W
    return inner * 100
  }

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cartesian || cols === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const fx = (e.clientX - rect.left) / rect.width
    const pointed = type === 'line' || type === 'area' || type === 'stackedArea'
    const i = pointed ? Math.round(fx * (cols - 1)) : Math.floor(fx * cols)
    setHover(Math.max(0, Math.min(cols - 1, i)))
  }

  return (
    <div className="chart">
      <div
        className="chart__canvas"
        style={{ height }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {cartesian ? (
          <>
            {/* y-axis ticks (crisp HTML — avoids the stretched-SVG text problem) */}
            <div className="chart__yaxis" aria-hidden="true">
              <span className="chart__ytick">{max}</span>
              <span className="chart__ytick">{Math.round(max / 2)}</span>
              <span className="chart__ytick">0</span>
            </div>
            <svg className="chart__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${type} chart`}>
              <Grid max={max} />
              {(type === 'line' || type === 'area') && <LineArea series={series} area={type === 'area'} max={max} uid={uid} />}
              {type === 'stackedArea' && <StackedArea series={series} max={max} />}
              {type === 'bar' && <Bars series={series} cols={cols} max={max} hover={hover} />}
              {type === 'stacked' && <Stacked series={series} cols={cols} max={max} hover={hover} />}
              {/* tracking cursor */}
              {hover !== null && <line className="chart__cursor" x1={(colPct(hover) / 100) * W} y1={PAD} x2={(colPct(hover) / 100) * W} y2={H - PAD} />}
            </svg>
            {/* x-axis labels */}
            {labels && (
              <div className="chart__xlabels" aria-hidden="true">
                {labels.map((l, i) => (
                  <span key={l + i} className={`chart__xlabel ${hover === i ? 'chart__xlabel--on' : ''}`}>{l}</span>
                ))}
              </div>
            )}
            {/* tooltip */}
            {hover !== null && (
              <div className="chart__tip" style={{ left: `${colPct(hover)}%` }} role="tooltip">
                <div className="chart__tip-label">{labels?.[hover] ?? `#${hover + 1}`}</div>
                {series.map((s, si) => (
                  <div key={s.name} className="chart__tip-row">
                    <span className="chart__tip-dot" style={{ background: chartVar(si) }} />
                    <span className="chart__tip-name">{s.name}</span>
                    <span className="chart__tip-val">{s.values[hover] ?? 0}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <Donut series={series[0]} labels={labels} />
        )}
      </div>
      {showLegend && (
        <div className="chart__legend">
          {(type === 'donut' ? (series[0]?.values ?? []).map((_, i) => ({ name: labels?.[i] ?? `Slice ${i + 1}`, i })) : series.map((s, i) => ({ name: s.name, i }))).map(
            ({ name, i }) => (
              <span key={name + i} className="chart__legend-item">
                <span className="chart__swatch" style={{ background: chartVar(i) }} />
                {name}
              </span>
            ),
          )}
        </div>
      )}
    </div>
  )
}

/* ---- Gridlines ------------------------------------------------------------ */
function Grid({ max }: { max: number }) {
  // Four horizontal gridlines at 0/25/50/75/100% + the baseline. Horizontal
  // lines don't distort under preserveAspectRatio="none".
  const rows = [0, 0.25, 0.5, 0.75, 1]
  void max
  return (
    <g>
      {rows.map((r) => {
        const y = PAD + r * (H - PAD * 2)
        const baseline = r === 1
        return <line key={r} x1={PAD} y1={y} x2={W - PAD} y2={y} className={baseline ? 'chart__axis' : 'chart__grid'} />
      })}
    </g>
  )
}

/* ---- Line / Area ---------------------------------------------------------- */
function LineArea({ series, area, max, uid }: { series: ChartSeries[]; area: boolean; max: number; uid: string }) {
  const toPts = (vals: number[]) => {
    const step = (W - PAD * 2) / Math.max(1, vals.length - 1)
    return vals.map((v, i) => [PAD + i * step, H - PAD - (v / max) * (H - PAD * 2)] as const)
  }
  return (
    <>
      {/* B★6: area fills use a VERTICAL gradient (opaque near the line → fading
          to ~transparent at the baseline) instead of a flat 14% wash — the
          Recharts / shadcn-charts look, reads far more premium than a slab. */}
      {area && (
        <defs>
          {series.map((s, si) => (
            <linearGradient key={s.name} id={`${uid}-area-${si}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartVar(si)} stopOpacity={0.26} />
              <stop offset="100%" stopColor={chartVar(si)} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
      )}
      {series.map((s, si) => {
        const pts = toPts(s.values)
        const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
        const areaD = `${d} L${(W - PAD).toFixed(1)} ${H - PAD} L${PAD.toFixed(1)} ${H - PAD} Z`
        return (
          <g key={s.name}>
            {area && <path d={areaD} fill={`url(#${uid}-area-${si})`} />}
            <path d={d} fill="none" stroke={chartVar(si)} strokeWidth={2} strokeDasharray={chartDash(si)} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        )
      })}
    </>
  )
}

/* ---- Stacked area --------------------------------------------------------- */
function StackedArea({ series, max }: { series: ChartSeries[]; max: number }) {
  const cols = series[0]?.values.length ?? 0
  const step = (W - PAD * 2) / Math.max(1, cols - 1)
  const x = (i: number) => PAD + i * step
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2)
  const acc = Array.from({ length: cols }, () => 0)
  return (
    <>
      {series.map((s, si) => {
        const top: Array<[number, number]> = []
        const bottom: Array<[number, number]> = []
        for (let i = 0; i < cols; i++) {
          const base = acc[i] ?? 0
          const next = base + (s.values[i] ?? 0)
          bottom.push([x(i), y(base)])
          top.push([x(i), y(next)])
          acc[i] = next
        }
        const dTop = top.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`).join(' ')
        const dBottom = bottom.reverse().map(([px, py]) => `L${px.toFixed(1)} ${py.toFixed(1)}`).join(' ')
        return <path key={s.name} d={`${dTop} ${dBottom} Z`} fill={chartVar(si)} opacity={0.85} />
      })}
    </>
  )
}

/* ---- Grouped bars --------------------------------------------------------- */
function Bars({ series, cols, max, hover }: { series: ChartSeries[]; cols: number; max: number; hover: number | null }) {
  const groupW = (W - PAD * 2) / Math.max(1, cols)
  const barGap = 2
  const barW = (groupW - barGap * (series.length + 1)) / Math.max(1, series.length)
  return (
    <>
      {Array.from({ length: cols }).map((_, ci) =>
        series.map((s, si) => {
          const v = s.values[ci] ?? 0
          const h = (v / max) * (H - PAD * 2)
          const x = PAD + ci * groupW + barGap + si * (barW + barGap)
          return <rect key={`${ci}-${si}`} x={x} y={H - PAD - h} width={Math.max(1, barW)} height={h} rx={2.5} fill={chartVar(si)} opacity={hover === null || hover === ci ? 1 : 0.45} />
        }),
      )}
    </>
  )
}

/* ---- Stacked bars --------------------------------------------------------- */
function Stacked({ series, cols, max, hover }: { series: ChartSeries[]; cols: number; max: number; hover: number | null }) {
  const groupW = (W - PAD * 2) / Math.max(1, cols)
  const barW = groupW * 0.56
  return (
    <>
      {Array.from({ length: cols }).map((_, ci) => {
        let acc = 0
        const x = PAD + ci * groupW + (groupW - barW) / 2
        return series.map((s, si) => {
          const v = s.values[ci] ?? 0
          const h = (v / max) * (H - PAD * 2)
          const yPos = H - PAD - acc - h
          acc += h
          return <rect key={`${ci}-${si}`} x={x} y={yPos} width={barW} height={Math.max(0, h)} fill={chartVar(si)} opacity={hover === null || hover === ci ? 1 : 0.45} />
        })
      })}
    </>
  )
}

/* ---- Donut (hoverable, popover tooltip) ----------------------------------- */
/* Consistency with the cartesian charts: no baked-in slice %s on the ring —
 * the centre always shows the total, and hovering a slice reveals the SAME
 * `.chart__tip` popover the other chart types use (share % + value), following
 * the cursor. One tooltip language across every chart shape. */
function Donut({ series, labels }: { series?: ChartSeries; labels?: string[] }) {
  const [tip, setTip] = useState<{ i: number; x: number; y: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const vals = series?.values ?? []
  const total = Math.max(1, vals.reduce((a, b) => a + b, 0))
  const r = 52
  const cx = 75
  const cy = 75
  const C = 2 * Math.PI * r
  const hi = tip?.i ?? null
  let offset = 0
  // Cursor position is measured RELATIVE TO the wrapper (a positioned ancestor),
  // not the viewport — so the popover follows the cursor regardless of any
  // transform/container ancestor that would otherwise break `position: fixed`.
  const at = (e: React.MouseEvent, i: number) => {
    const box = wrapRef.current?.getBoundingClientRect()
    setTip({ i, x: e.clientX - (box?.left ?? 0), y: e.clientY - (box?.top ?? 0) })
  }
  return (
    // Fill the fixed-height canvas + centre the donut. height:100% is load-bearing:
    // the SVG sizes off it (square via viewBox), so the donut can't overflow the box.
    <div ref={wrapRef} style={{ position: 'relative', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg className="chart__svg chart__svg--donut" viewBox="0 0 150 150" role="img" aria-label="donut chart">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--k-surface-sunken)" strokeWidth={18} />
        {vals.map((v, i) => {
          const len = (v / total) * C
          const seg = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={chartVar(i)}
              strokeWidth={hi === i ? 22 : 18}
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              opacity={hi === null || hi === i ? 1 : 0.5}
              style={{ cursor: 'pointer', transition: 'stroke-width var(--k-dur-fast,140ms) var(--k-ease,ease)' }}
              onMouseMove={(e) => at(e, i)}
              onMouseLeave={() => setTip(null)}
            />
          )
          offset += len
          return seg
        })}
        <text x={cx} y={cy - 2} textAnchor="middle" className="chart__donut-num">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="chart__donut-cap">total</text>
      </svg>
      {tip && (() => {
        const v = vals[tip.i] ?? 0
        const pct = Math.round((v / total) * 100)
        return (
          <div className="chart__tip" role="tooltip" style={{ position: 'absolute', left: tip.x + 14, top: tip.y + 14, transform: 'none' }}>
            <div className="chart__tip-label">{labels?.[tip.i] ?? `Slice ${tip.i + 1}`}</div>
            <div className="chart__tip-row">
              <span className="chart__tip-dot" style={{ background: chartVar(tip.i) }} />
              <span className="chart__tip-name">share</span>
              <span className="chart__tip-val">{pct}%</span>
            </div>
            <div className="chart__tip-row">
              <span className="chart__tip-dot" style={{ background: 'transparent' }} />
              <span className="chart__tip-name">value</span>
              <span className="chart__tip-val">{v}</span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
