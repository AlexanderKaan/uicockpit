import type { CSSProperties } from 'react'

/* ============================================================
 * Per-screen skeletons — low-fidelity wireframes of the REAL layout.
 *
 * Best practice (perceived-performance skeleton screens): the placeholder
 * must mirror the actual screen 1:1 — same containers, same grid, same block
 * positions and sizes — so (a) there's zero layout shift when content lands,
 * and (b) the wait "pre-teaches" the user where things will be.
 *
 * We get that for free by reusing the SAME layout classes as the live screens
 * (.dash__head, .dash__stats, .quickact, .tbl, the two-pane grids …) and just
 * filling them with `.sk` shimmer blocks instead of content. Change a screen's
 * layout → its skeleton inherits it. Shimmer respects prefers-reduced-motion
 * via the global guard on `.sk`.
 * ============================================================ */

/** One shimmer block. Defaults to a full-width 12px line. */
function B({ w = '100%', h = 12, r, mb, grow, style }: { w?: number | string; h?: number | string; r?: number | string; mb?: number; grow?: boolean; style?: CSSProperties }) {
  return (
    <div
      className="sk"
      style={{
        width: w,
        height: h,
        flex: grow ? 1 : 'none',
        ...(r != null ? { borderRadius: r } : {}),
        ...(mb != null ? { marginBottom: mb } : {}),
        ...style,
      }}
    />
  )
}
/** Circle block (avatars, icon chips). */
function Circle({ s = 30, style }: { s?: number; style?: CSSProperties }) {
  return <B w={s} h={s} r={999} style={style} />
}
const arr = (n: number) => Array.from({ length: n })
const RMD = 'var(--k-radius-md)'

// ---- shared header (breadcrumb + title + optional action button) ----
function SkHead({ btn = true, segAfter = false }: { btn?: boolean; segAfter?: boolean }) {
  return (
    <>
      <B w={168} h={12} mb={14} />
      <div className="dash__head">
        <B w={210} h={26} />
        {btn && <B w={132} h={32} r={RMD} />}
      </div>
      {segAfter && <B w={184} h={32} r={RMD} style={{ marginBottom: 14 }} />}
    </>
  )
}

// ---- archetype: a real table shell with shimmer cells ----
function SkTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <table className="tbl">
      <thead>
        <tr>{arr(cols).map((_, c) => <th key={c}><B w={c === 0 ? 90 : 60} h={9} /></th>)}</tr>
      </thead>
      <tbody>
        {arr(rows).map((_, ri) => (
          <tr key={ri}>
            {arr(cols).map((_, c) => <td key={c}><B w={c === 0 ? '60%' : c === cols - 1 ? 20 : '45%'} h={11} /></td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ---- archetype: stat-tile row (KPI cards with a sparkline area) ----
function SkStats({ n = 4, spark = true }: { n?: number; spark?: boolean }) {
  return (
    <div className="dash__stats">
      {arr(n).map((_, i) => (
        <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <B w="55%" h={10} />
          <B w="68%" h={24} />
          {spark && <B h={32} style={{ marginTop: 4 }} />}
        </div>
      ))}
    </div>
  )
}

// ---- archetype: list rows (inbox / notifications / convo) ----
function SkList({ rows = 6, avatar = true }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--k-stack-gap)' }}>
      {arr(rows).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {avatar && <Circle s={32} />}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <B w={`${40 + ((i * 13) % 35)}%`} h={11} />
            <B w={`${60 + ((i * 7) % 30)}%`} h={9} />
          </div>
          <B w={36} h={9} />
        </div>
      ))}
    </div>
  )
}

// ---- archetype: tile grid (media / browse) ----
function SkGrid({ n = 8, cols = 4, aspect = '4 / 3' }: { n?: number; cols?: number; aspect?: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
      {arr(n).map((_, i) => (
        <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <B h="auto" style={{ aspectRatio: aspect }} />
          <B w="70%" h={10} />
          <B w="40%" h={8} />
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Page compositions
// ============================================================

function SkOverview() {
  return (
    <>
      <B w={168} h={12} mb={14} />
      {/* upgrade banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <Circle s={30} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}><B w="40%" h={11} /><B w="55%" h={9} /></div>
        <B w={84} h={30} r={RMD} />
      </div>
      <div className="dash__head"><B w={210} h={26} /><div style={{ display: 'flex', gap: 8 }}><B w={36} h={32} r={RMD} /><B w={132} h={32} r={RMD} /></div></div>
      <SkStats n={4} />
      {/* usage meter */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><B w={180} h={11} /><B w={120} h={9} /></div>
        <B h={8} r={999} />
      </div>
      <B w={110} h={14} mb={10} />
      <div className="barchart" style={{ height: 120, marginBottom: 24 }}>
        {[55, 68, 42, 80, 51, 73, 90].map((v, i) => <B key={i} w="100%" h={`${v}%`} style={{ alignSelf: 'flex-end' }} />)}
      </div>
      <B w={90} h={14} mb={10} />
      <SkList rows={4} avatar />
    </>
  )
}

function SkProjects() {
  return (
    <>
      <SkHead segAfter />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}><B w={36} h={10} /><B w={300} h={32} r={RMD} /></div>
      <SkTable rows={5} cols={4} />
    </>
  )
}

// ---- board: toolbar + 4 kanban columns of card placeholders ----
function SkInbox() {
  return (
    <>
      <SkHead segAfter />
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}><B w={320} h={36} r={RMD} grow style={{ maxWidth: 320 }} /><B w={140} h={36} r={RMD} /></div>
      <SkList rows={7} avatar />
    </>
  )
}

function SkMedia() {
  return (
    <>
      <SkHead />
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        {/* folder tree */}
        <div style={{ width: 184, flex: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {arr(6).map((_, i) => <B key={i} w={`${55 + ((i * 11) % 40)}%`} h={14} style={{ marginLeft: i > 0 && i < 5 ? 14 : 0 }} />)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <B h={70} r={RMD} mb={18} />
          <B w={140} h={14} mb={10} />
          <SkGrid n={8} cols={4} />
        </div>
      </div>
    </>
  )
}

function SkForm({ sections = 3 }: { sections?: number }) {
  return (
    <>
      <SkHead btn={false} />
      <div style={{ maxWidth: 620, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {arr(sections).map((_, i) => (
          <section key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <B w={140} h={14} mb={2} />
            {arr(2 + (i % 2)).map((_, j) => <div key={j} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><B w={90} h={9} /><B h={34} r={RMD} /></div>)}
          </section>
        ))}
      </div>
    </>
  )
}


// ---- docs: page-tree + document pane ----
function SkDocs() {
  return (
    <>
      <SkHead />
      <B w={320} h={32} r={RMD} mb={16} />
      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {arr(6).map((_, i) => <B key={i} w={`${55 + ((i * 11) % 40)}%`} h={14} style={{ marginLeft: i % 3 ? 14 : 0 }} />)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <B w={180} h={32} r={RMD} />
          <B w="55%" h={22} /><B w="90%" h={11} /><B w="80%" h={11} /><B h={90} r={RMD} /><B w="85%" h={11} />
        </div>
      </div>
    </>
  )
}

/** The six archetype screens (the rest of the suite was culled). */
function body(page: string) {
  switch (page) {
    case 'overview': return <SkOverview />
    case 'projects': return <SkProjects />
    case 'docs': return <SkDocs />
    case 'inbox': return <SkInbox />
    case 'media': return <SkMedia />
    case 'settings': return <SkForm sections={3} />
    default: return <SkOverview />
  }
}

/** Layout-accurate loading skeleton for the given page. */
export function PageSkeleton({ page }: { page: string }) {
  return (
    <div className="dash__main" aria-busy="true" aria-label="Loading">
      {body(page)}
    </div>
  )
}
