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
      {/* quick actions (2fr) + team (1fr) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <div>
          <B w={120} h={14} mb={10} />
          <div className="quickact">
            {arr(4).map((_, i) => <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><Circle s={30} /><B w="70%" h={10} /><B w="50%" h={8} /></div>)}
          </div>
        </div>
        <div>
          <B w={100} h={14} mb={10} />
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><B w={60} h={12} /><B w={80} h={8} /></div>
            <div style={{ display: 'flex' }}>{arr(4).map((_, i) => <Circle key={i} s={26} style={{ marginLeft: i ? -8 : 0 }} />)}</div>
          </div>
        </div>
      </div>
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
function SkBoard() {
  return (
    <>
      <SkHead />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <B w={180} h={32} r={RMD} /><B w={110} h={26} r={999} /><B w={70} h={28} r={RMD} /><B w={70} h={28} r={RMD} />
        <div style={{ flex: 1 }} /><B w={130} h={28} r={RMD} />
      </div>
      <div style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(0,1fr)', gap: 10 }}>
        {arr(4).map((_, c) => (
          <div key={c} style={{ background: 'var(--k-surface-sunken)', borderRadius: RMD, padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <B w="45%" h={11} />
            {arr(c === 2 ? 1 : 2).map((__, i) => (
              <div key={i} style={{ background: 'var(--k-surface)', border: '1px solid var(--k-border)', borderRadius: 'var(--k-radius-sm)', padding: 8, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <B w="85%" h={11} /><B w={48} h={14} r="var(--k-radius-sm)" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><B w={62} h={11} /><Circle s={22} /></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

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

function SkAnalytics() {
  return (
    <>
      <SkHead btn={false} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: -44, marginBottom: 20 }}><B w={150} h={32} r={RMD} /><B w={90} h={32} r={RMD} /></div>
      <div className="card"><B w={120} h={12} mb={14} /><B h={220} /></div>
    </>
  )
}

function SkCalendar() {
  return (
    <>
      <SkHead />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 24, alignItems: 'flex-start' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><B w={110} h={14} /><B w={64} h={24} r={RMD} /></div>
          <div className="calendar">
            {arr(7).map((_, i) => <span key={`h${i}`} className="calendar__head"><B w={12} h={9} /></span>)}
            {arr(30).map((_, i) => <B key={i} h={28} r="var(--k-radius-sm)" />)}
          </div>
        </div>
        <div className="card">
          <B w={120} h={14} mb={4} /><B w={150} h={9} mb={12} />
          <div className="slotpicker">{arr(10).map((_, i) => <B key={i} h={36} r={RMD} />)}</div>
          <B h={36} r={RMD} style={{ marginTop: 14 }} />
        </div>
      </div>
    </>
  )
}

function SkFeed() {
  return (
    <>
      <SkHead />
      {/* activity timeline */}
      <article className="card" style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {arr(5).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Circle s={20} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', gap: 12 }}><B w="70%" h={10} /><B w={48} h={8} /></div>
          </div>
        ))}
      </article>
    </>
  )
}

function SkMessages() {
  return (
    <>
      <B w={168} h={12} mb={14} />
      <div style={{ display: 'grid', gridTemplateColumns: '256px minmax(0,1fr)', border: '1px solid var(--k-border)', borderRadius: 'var(--k-radius-lg)', overflow: 'hidden', height: 'calc(100vh - 168px)', minHeight: 440, background: 'var(--k-surface)' }}>
        <aside style={{ borderRight: 'var(--k-divider)', padding: 8, display: 'flex', flexDirection: 'column', gap: 'var(--k-stack-gap)' }}>
          <B h={34} r={RMD} mb={4} />
          {arr(5).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Circle s={32} /><div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}><B w="55%" h={10} /><B w="80%" h={8} /></div></div>
          ))}
        </aside>
        <section style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: 'var(--k-divider)' }}><Circle s={28} /><div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><B w={90} h={10} /><B w={50} h={8} /></div></div>
          <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[['flex-start', 200], ['flex-end', 240], ['flex-start', 160]].map(([side, w], i) => (
              <B key={i} w={w as number} h={34} r={RMD} style={{ alignSelf: side as string }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: 'var(--k-divider)' }}><B h={36} r={RMD} grow /><B w={36} h={36} r={RMD} /></div>
        </section>
      </div>
    </>
  )
}

function SkProfile() {
  return (
    <>
      <B w={168} h={12} mb={14} />
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 18 }}>
        <B h={120} r={0} />
        <div style={{ padding: '0 20px', display: 'flex', gap: 16, alignItems: 'flex-end', marginTop: -38 }}>
          <Circle s={86} style={{ border: '3px solid var(--k-surface)' }} />
          <div style={{ flex: 1, paddingBottom: 6, display: 'flex', flexDirection: 'column', gap: 6 }}><B w={140} h={18} /><B w={180} h={10} /></div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 6 }}><B w={92} h={30} r={RMD} /><B w={84} h={30} r={RMD} /></div>
        </div>
        <div style={{ padding: '14px 20px' }}><B w="70%" h={10} mb={14} /><div style={{ display: 'flex', gap: 28 }}>{arr(3).map((_, i) => <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><B w={40} h={14} /><B w={50} h={8} /></div>)}</div></div>
      </div>
      <B w={184} h={32} r={RMD} mb={14} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>{arr(3).map((_, i) => <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><B w="40%" h={9} /><B w="55%" h={22} /><B w="65%" h={8} /></div>)}</div>
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


// ---- pricing (Billing › Plans) ----
function SkPricing() {
  return (
    <>
      <SkHead btn={false} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {arr(3).map((_, i) => (
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <B w="50%" h={12} /><B w="65%" h={28} />
            {arr(4).map((_, j) => <B key={j} w={`${70 + ((j * 9) % 25)}%`} h={9} />)}
            <B h={36} r={RMD} style={{ marginTop: 4 }} />
          </div>
        ))}
      </div>
    </>
  )
}

// ---- dashboard archetype (Billing/Cloud overview) ----
function SkDashboard({ stats = 3 }: { stats?: number }) {
  return (
    <>
      <SkHead />
      <div className="dash__stats" style={{ gridTemplateColumns: `repeat(${stats}, 1fr)` }}>
        {arr(stats).map((_, i) => <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}><B w="50%" h={10} /><B w="65%" h={24} /></div>)}
      </div>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--k-stack-gap)' }}>
        <B w={140} h={12} mb={4} />
        {arr(5).map((_, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Circle s={28} /><B w={`${40 + ((i * 11) % 30)}%`} h={11} grow style={{ maxWidth: 280 }} /><B w={56} h={9} /></div>)}
      </div>
    </>
  )
}

// ---- code/log viewer (Cloud › Logs) ----
function SkCode() {
  return (
    <>
      <SkHead btn={false} />
      <div className="card" style={{ background: 'var(--k-surface-sunken)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {arr(12).map((_, i) => <B key={i} w={`${30 + ((i * 17) % 60)}%`} h={9} />)}
      </div>
    </>
  )
}

// ============================================================
// Dispatcher
// ============================================================

function body(page: string, sub: string) {
  switch (page) {
    case 'overview': return <SkOverview />
    case 'projects': return <SkProjects />
    case 'board': return <SkBoard />
    case 'inbox': return <SkInbox />
    case 'media': return <SkMedia />
    case 'analytics': return <SkAnalytics />
    case 'calendar': return <SkCalendar />
    case 'feed': return <SkFeed />
    case 'messages': return <SkMessages />
    case 'profile': return <SkProfile />
    case 'signin': return <div style={{ display: 'grid', placeItems: 'center', padding: '20px 0' }}><div className="card" style={{ width: 384, display: 'flex', flexDirection: 'column', gap: 14 }}><B w={184} h={32} r={RMD} /><B w="60%" h={18} style={{ alignSelf: 'center' }} />{arr(2).map((_, i) => <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><B w={70} h={9} /><B h={34} r={RMD} /></div>)}<B h={36} r={RMD} /></div></div>
    case 'settings':
      return sub === 'members'
        ? <><SkHead /><div className="card__col" style={{ gap: 6 }}>{arr(5).map((_, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid var(--k-border)', borderRadius: RMD }}><Circle s={32} /><div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}><B w={`${30 + ((i * 9) % 20)}%`} h={11} /><B w={`${45 + ((i * 7) % 20)}%`} h={8} /></div><B w={64} h={9} /></div>)}</div></>
        : <SkForm sections={3} />
    case 'crm':
      return sub === 'contacts' ? <><SkHead /><B h={48} r={RMD} mb={16} /><SkTable rows={6} cols={5} /></>
        : sub === 'pipeline' ? <><SkHead /><SkGrid n={4} cols={4} aspect="0.7" /></>
          : sub === 'activity' ? <><SkHead /><SkList rows={6} /></>
            : <><SkHead /><div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}><SkForm sections={2} /><div className="card" style={{ minHeight: 280 }}><B h={240} /></div></div></>
    case 'helpdesk':
      return sub === 'inbox' ? <><SkHead btn={false} /><B h={36} r={RMD} mb={16} /><SkList rows={5} avatar /></>
        : sub === 'ticket' ? <><SkHead /><div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}><div className="card" style={{ minHeight: 300 }}><B h={260} /></div><SkForm sections={2} /></div></>
          : <><SkHead /><B h={48} r={RMD} mb={16} /><SkTable rows={6} cols={5} /></>
    case 'billing':
      return sub === 'invoices' ? <><SkHead /><SkTable rows={6} cols={4} /></>
        : sub === 'plans' ? <SkPricing />
          : <SkDashboard stats={3} />
    case 'cloud':
      return sub === 'domains' ? <><SkHead /><SkTable rows={5} cols={4} /></>
        : sub === 'logs' ? <SkCode />
          : sub === 'status' ? <><SkHead /><div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--k-stack-gap)' }}><B h={40} r={RMD} mb={4} />{arr(5).map((_, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><B w={110} h={11} /><B h={10} grow /><B w={48} h={10} /></div>)}</div></>
            : <SkDashboard stats={4} />
    default: return <SkOverview />
  }
}

/** Layout-accurate loading skeleton for the given page (+ active sub-page). */
export function PageSkeleton({ page, sub = '' }: { page: string; sub?: string }) {
  return (
    <div className="dash__main" aria-busy="true" aria-label="Loading">
      {body(page, sub)}
    </div>
  )
}
