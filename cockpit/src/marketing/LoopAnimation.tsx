/**
 * LoopAnimation — the "how it works" explainer for the marketing loop section.
 *
 * A self-contained, looping SVG (CSS keyframes, no JS): a design language on the
 * left → a pulse flows along connectors → a grid of components adopts the style
 * (control fills, toggle turns on, badge tints, input/card gain the accent) → an
 * UNKNOWN component materialises and adopts it too → a "Coherent · checked" seal.
 * It mirrors Define → Apply → Verify.
 *
 * NB: a <style> inside an inline SVG is NOT scoped — it applies document-wide.
 * So every class + @keyframes here is namespaced `hiwa-` to avoid collisions.
 * The CSS is a single static string child of <style> (no dangerouslySetInnerHTML,
 * no untrusted input). Pulses use transform:scale (Safari animates that; it won't
 * animate the `r` attribute). Honours prefers-reduced-motion by freezing on the
 * coherent end-state.
 */
const CSS = `
.hiwa {
  --accent:#007AFF; --ink:#0a0a0b; --muted:#6b6b73; --faint:#b7bcc4;
  --line:#e6e8ec; --surface:#ffffff; --success:#12b76a; --tint:#eef2f7;
  display:block; width:100%; height:auto;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
.hiwa-cap { fill: var(--muted); font-size: 12px; }
.hiwa-cap-sm { fill: var(--faint); font-size: 10px; letter-spacing: .06em; }
.hiwa-card-fill { fill: var(--surface); stroke: var(--line); stroke-width: 1.5; }
.hiwa-tokbar { fill: var(--tint); }

.hiwa-comp { color: var(--faint); animation: hiwa-adopt 6s ease-in-out infinite; }
@keyframes hiwa-adopt {
  0%,16% { color: var(--faint); }
  26%,80% { color: var(--accent); }
  92%,100% { color: var(--faint); }
}
.hiwa-d1 { animation-delay: 0s; }   .hiwa-d4 { animation-delay: .15s; }
.hiwa-d2 { animation-delay: .30s; } .hiwa-d5 { animation-delay: .45s; }
.hiwa-d3 { animation-delay: .60s; } .hiwa-d6 { animation-delay: .75s; }

.hiwa-wire { fill: none; stroke: var(--line); stroke-width: 1.5; }
.hiwa-flow { fill: none; stroke: var(--accent); stroke-width: 2.5; stroke-linecap: round;
             stroke-dasharray: 7 93; opacity: 0; animation: hiwa-flow 6s ease-in-out infinite; }
@keyframes hiwa-flow {
  0%   { stroke-dashoffset: 0;   opacity: 0; }
  6%   { stroke-dashoffset: 0;   opacity: 1; }
  26%  { stroke-dashoffset: -100; opacity: 1; }
  33%  { stroke-dashoffset: -100; opacity: 0; }
  100% { stroke-dashoffset: -100; opacity: 0; }
}

.hiwa-pulse { fill: none; stroke: var(--accent); stroke-width: 1.5; vector-effect: non-scaling-stroke;
              transform-box: fill-box; transform-origin: center; animation: hiwa-pulse 3s ease-out infinite; }
.hiwa-pulse2 { animation-delay: 1.5s; }
@keyframes hiwa-pulse { 0% { transform: scale(.5); opacity: .32; } 70%,100% { transform: scale(2.6); opacity: 0; } }

.hiwa-unknown { transform-box: fill-box; transform-origin: center; animation: hiwa-emerge 6s ease-in-out infinite; }
@keyframes hiwa-emerge {
  0%,20% { opacity: 0; transform: scale(.82); }
  34%,80% { opacity: 1; transform: scale(1); }
  92%,100% { opacity: 0; transform: scale(.82); }
}
.hiwa-ghost { animation: hiwa-ghost 6s ease-in-out infinite; }
@keyframes hiwa-ghost { 0%,18% { opacity: 1; } 30%,80% { opacity: 0; } 94%,100% { opacity: 1; } }

.hiwa-seal { transform-box: fill-box; transform-origin: center; animation: hiwa-seal 6s ease-in-out infinite; }
@keyframes hiwa-seal {
  0%,42% { opacity: 0; transform: scale(.85); }
  54%,78% { opacity: 1; transform: scale(1); }
  90%,100% { opacity: 0; transform: scale(.92); }
}

@media (prefers-reduced-motion: reduce) {
  .hiwa-comp, .hiwa-flow, .hiwa-pulse, .hiwa-unknown, .hiwa-ghost, .hiwa-seal { animation: none; }
  .hiwa-comp { color: var(--accent); }
  .hiwa-flow, .hiwa-ghost { opacity: 0; }
  .hiwa-unknown, .hiwa-seal { opacity: 1; }
}
`

export function LoopAnimation() {
  return (
    <svg
      className="hiwa"
      viewBox="0 0 720 340"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      <title>How UIcockpit works</title>
      <desc>
        Your design language is configured once on the left; a pulse flows to a grid of
        components on the right, which all adopt the coherent style — including a new,
        previously unbuilt component — and a coherence check confirms it.
      </desc>
      <style>{CSS}</style>

      {/* LEFT: your design language (the single source) */}
      <circle className="hiwa-pulse" cx="111" cy="180" r="22" />
      <circle className="hiwa-pulse hiwa-pulse2" cx="111" cy="180" r="22" />
      <rect x="36" y="124" width="150" height="112" rx="16" className="hiwa-card-fill" />
      <circle cx="60" cy="152" r="8" fill="var(--accent)" />
      <rect x="78" y="147" width="86" height="10" rx="5" className="hiwa-tokbar" />
      <text x="50" y="187" fontSize="16" fontWeight="600" fill="var(--ink)">Aa</text>
      <rect x="78" y="176" width="86" height="10" rx="5" className="hiwa-tokbar" />
      <rect x="52" y="205" width="16" height="16" rx="5" fill="none" stroke="var(--accent)" strokeWidth="2" />
      <rect x="78" y="206" width="86" height="10" rx="5" className="hiwa-tokbar" />
      <text x="111" y="258" textAnchor="middle" className="hiwa-cap">Your design language</text>
      <text x="111" y="273" textAnchor="middle" className="hiwa-cap-sm">CONFIGURE ONCE</text>

      {/* connectors */}
      <g>
        <path className="hiwa-wire" d="M186 180 C 250 150, 252 116, 310 116" />
        <path className="hiwa-wire" d="M186 180 C 320 140, 402 116, 460 116" />
        <path className="hiwa-wire" d="M186 180 C 384 130, 486 116, 596 116" />
        <path className="hiwa-wire" d="M186 180 C 250 214, 252 250, 313 250" />
        <path className="hiwa-wire" d="M186 180 C 322 232, 384 250, 445 250" />
        <path className="hiwa-wire" d="M186 180 C 384 240, 476 250, 576 250" />
        <path className="hiwa-flow hiwa-d1" d="M186 180 C 250 150, 252 116, 310 116" />
        <path className="hiwa-flow hiwa-d2" d="M186 180 C 320 140, 402 116, 460 116" />
        <path className="hiwa-flow hiwa-d3" d="M186 180 C 384 130, 486 116, 596 116" />
        <path className="hiwa-flow hiwa-d4" d="M186 180 C 250 214, 252 250, 313 250" />
        <path className="hiwa-flow hiwa-d5" d="M186 180 C 322 232, 384 250, 445 250" />
        <path className="hiwa-flow hiwa-d6" d="M186 180 C 384 240, 476 250, 576 250" />
      </g>

      <text x="470" y="66" textAnchor="middle" className="hiwa-cap">Every screen inherits it</text>
      <text x="470" y="80" textAnchor="middle" className="hiwa-cap-sm">EVEN THE ONES YOU NEVER BUILT</text>

      {/* RIGHT: components adopting the language */}
      {/* c1 · primary button (control: fills) */}
      <g className="hiwa-comp hiwa-d1">
        <rect x="317" y="99" width="96" height="34" rx="9" fill="currentColor" />
        <rect x="340" y="112" width="50" height="8" rx="4" fill="#ffffff" opacity=".92" />
      </g>
      {/* c2 · toggle (selectable: turns on) */}
      <g className="hiwa-comp hiwa-d2">
        <rect x="472" y="101" width="56" height="30" rx="15" fill="currentColor" />
        <circle cx="513" cy="116" r="11" fill="#ffffff" />
      </g>
      {/* c3 · badge (tone-bearer: soft tint) */}
      <g className="hiwa-comp hiwa-d3">
        <rect x="596" y="103" width="64" height="26" rx="13" fill="currentColor" fillOpacity=".16" />
        <circle cx="611" cy="116" r="4" fill="currentColor" />
        <rect x="622" y="112" width="30" height="8" rx="4" fill="currentColor" fillOpacity=".8" />
      </g>
      {/* c4 · input (control: accent outline + caret) */}
      <g className="hiwa-comp hiwa-d4">
        <rect x="313" y="233" width="104" height="34" rx="9" fill="#ffffff" stroke="currentColor" strokeWidth="1.5" />
        <rect x="332" y="247" width="46" height="6" rx="3" fill="#d3d7dd" />
        <rect x="325" y="243" width="2.5" height="14" rx="1.25" fill="currentColor" />
      </g>
      {/* c5 · card (surface) */}
      <g className="hiwa-comp hiwa-d5">
        <rect x="445" y="222" width="110" height="56" rx="10" fill="#ffffff" stroke="currentColor" strokeWidth="1.5" />
        <rect x="457" y="234" width="42" height="8" rx="4" fill="currentColor" fillOpacity=".85" />
        <rect x="457" y="251" width="86" height="6" rx="3" fill="#e3e5e9" />
        <rect x="457" y="263" width="62" height="6" rx="3" fill="#e3e5e9" />
      </g>
      {/* c6 · the UNKNOWN component: emerges, then adopts + is checked */}
      <g>
        <g className="hiwa-ghost">
          <rect x="576" y="224" width="104" height="52" rx="10" fill="none" stroke="#cfd3da" strokeWidth="1.5" strokeDasharray="5 6" />
          <text x="628" y="255" textAnchor="middle" fontSize="18" fontWeight="600" fill="#cfd3da">?</text>
        </g>
        <g className="hiwa-unknown">
          <g className="hiwa-comp hiwa-d6">
            <rect x="576" y="224" width="104" height="52" rx="10" fill="#ffffff" stroke="currentColor" strokeWidth="1.5" />
            <rect x="588" y="236" width="40" height="8" rx="4" fill="currentColor" fillOpacity=".85" />
            <rect x="588" y="252" width="80" height="6" rx="3" fill="#e3e5e9" />
            <rect x="588" y="263" width="54" height="6" rx="3" fill="#e3e5e9" />
          </g>
          <circle cx="676" cy="222" r="11" fill="var(--success)" />
          <path d="M671 222 l3.4 3.4 l6 -6.6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>

      {/* coherence seal (the check) */}
      <g className="hiwa-seal">
        <rect x="298" y="300" width="146" height="30" rx="15" fill="#eafaf1" />
        <circle cx="318" cy="315" r="8" fill="var(--success)" />
        <path d="M314.5 315 l2.6 2.6 l4.6 -5.2" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <text x="334" y="319" fontSize="12" fontWeight="600" fill="#0b7a4b">Coherent · checked</text>
      </g>
    </svg>
  )
}
