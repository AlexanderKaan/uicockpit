<div align="center">

# UIcockpit

### Build a design system you actually like — and keep it in one place.

Make a handful of taste decisions, watch them apply across 74 components, and take the whole thing
with you: framework-neutral `--k-*` tokens **and** matching components, as one hosted `<link>`, a
download, Tailwind v4 `@theme`, or shadcn/ui CSS.

**Free · no account · paste it anywhere.**

[**Try it →** uicockpit.com](https://uicockpit.com) · [**Use a kit →** kit.uicockpit.com](https://kit.uicockpit.com) · [Docs](https://uicockpit.com/docs)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Live kit CDN](https://img.shields.io/badge/CDN-kit.uicockpit.com-f38020?logo=cloudflare&logoColor=white)](https://kit.uicockpit.com)
![Framework-neutral](https://img.shields.io/badge/framework-neutral-111)
![Price](https://img.shields.io/badge/price-%240%20forever-1ca85a)

![UIcockpit — pick a vibe, get a coherent component system](docs/preview.png)

</div>

---

## Why I made this 👋

If you've ever vibe-coded an app, you know the feeling. You're moving fast, you reach for the same
components for the twentieth time, and somewhere along the way you lose the thread. The radii start
to drift. The greys don't quite agree. There's always *one* button that's just… a little off. It all
works — but none of it feels like *yours*.

I kept hitting that wall, so I built UIcockpit to get out of it: a calm place to make the design
decisions **once**, see them ripple across a whole component set, and walk away with the result. No
spreadsheet of tokens, no hand-tuning forty little things — just a coherent system, in one artefact,
that you can paste anywhere.

It's framework-neutral (plain HTML, Vue, Svelte, React — whatever you're in), it's free, and there's
no account and no lock-in. If it saves you the same headache it saved me, that's the whole point.

Designers and developers, among friends. I hope it's useful. — **Alexander**

---

## The idea, in one line

shadcn gives you the components. **UIcockpit gives you the design language on top** — colour, type,
shape, density, motion — so your app looks *designed*, not defaulted. It doesn't replace shadcn or
Tailwind; it sits a friendly layer above them.

|  | shadcn / Material | **UIcockpit** |
|---|---|---|
| **Stack** | React + Tailwind assumed | **framework-neutral** — pastes over anything |
| **Output** | components; you bring the style | a coherent **design language**, in one file |
| **Built for** | humans reading docs | **an AI can apply it in one shot** (tokens + recipes + house rules) |

---

## Three ways to use it

### 1. One hosted `<link>` — the lazy way (recommended)

Build a kit at [uicockpit.com](https://uicockpit.com), copy your link, drop it in your `<head>`:

```html
<link rel="stylesheet" href="https://kit.uicockpit.com/k/<your-kit-key>.css">
```

That's the *whole* kit — every token **and** the component recipes (button, input, card, badge,
table, dialog, …) with proper hover / focus / disabled states — served from the edge. Your buttons
just work. Tweak the kit later and come back; the link is yours.

### 2. Own the files

Prefer to commit it? Download `tokens.css`, `tokens.json`, a Tailwind v4 `@theme` block, shadcn/ui
`globals.css`, a `BRIEF.md`, or an AI-prompt. No runtime, no dependency, nothing to eject from later.

### 3. Hand it to your AI

The AI-prompt export teaches your coding agent the token contract and a few house rules, so it builds
**on-brand** UI for you instead of reaching for the same grey again.

---

## What's in the box

- **120+ design tokens** — colour ramps (OKLCH, contrast-clamped), a type scale, spacing grid, radii,
  shadows, a 3-tier motion system, a multi-hue chart/avatar palette.
- **74 component recipes** — all token-driven, all with real state contracts, shipped in `tokens.css`
  and over the CDN.
- **7 export formats** + a live preview of your kit on a real app and a full component gallery — change one
  control, watch the whole thing move.
- **A WCAG contrast check** baked in, so the colours you pick stay readable.

---

## How it works

One configuration → **one single source** → every surface:

```
21 visual controls ──▶ --k-* tokens ──▶ ┌─ live preview (gallery + a real app, which dogfoods the export)
   (Brand · Type ·                       ├─ tokens.css / json / Tailwind / shadcn / BRIEF / AI-prompt
    Shape · Surface ·                     └─ hosted kit: kit.uicockpit.com/k/<key>.css
    Motion & icons)
```

The CDN runs the exact same function the download uses, so the hosted link is byte-identical to the
file you'd export. The demo app renders from the kit alone — so if the kit ever breaks, the app
breaks too, and we catch it.

---

## Run it locally

```bash
git clone https://github.com/alexanderkaan/uicockpit.git
cd uicockpit/cockpit
npm install
npm run dev          # configurator at http://localhost:5173
npm run build        # the build gate (icon-verify → audits → tsc → vite build)
npx vitest run       # tests
```

Vite + React 19 + TypeScript (strict). Architecture notes live in
[`DECISIONS.md`](./DECISIONS.md) · [`ICONS.md`](./ICONS.md).

---

## Contributing

This is meant to be a community thing, so come on in. A new colour theme, a missing component recipe,
an export adapter (Style Dictionary, CSS-in-JS, Figma variables), a framework adapter, an
accessibility fix — all very welcome. Start with [`CONTRIBUTING.md`](./CONTRIBUTING.md) and the
[`Code of Conduct`](./CODE_OF_CONDUCT.md), then open an issue or a discussion. Even just telling me
what felt clunky helps.

---

## Thanks 🙏

If UIcockpit is useful to you, a ⭐ genuinely makes my day and helps other makers find it.

<div align="center">

Made with care by **[Alexander Kaan](https://github.com/alexanderkaan)** at **[Pageminds](https://pageminds.com)** ·
[MIT](./LICENSE), free forever.

</div>
