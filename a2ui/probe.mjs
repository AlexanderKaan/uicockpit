import { readFileSync } from 'node:fs'
import { applyStream, buildTree, childRefs, parseStream, resolve, walk, FUNCTIONS } from './core.mjs'
import { BINDINGS } from './bindings.mjs'
import { check, describeBinding } from './check.mjs'

/** Resolve data-bound lists onto the node, so check() sees the ANSWER, not the pointer. */
function hydrate(node, model) {
  const out = { ...node }
  if (node.items) out.resolvedItems = resolve(node.items, model, null, FUNCTIONS)
  out.kids = (node.kids ?? []).map((k) => hydrate(k, model))
  return out
}

const file = process.argv[2] ?? 'message.jsonl'
const surfaceId = process.argv[3] ?? 'permit_1'
const surfaces = applyStream(parseStream(readFileSync(file, 'utf8')).map((m) => JSON.stringify(m)))
const s = surfaces.get(surfaceId) ?? (process.argv[3] ? null : [...surfaces.values()][0])
if (!s) { console.error(`no surface "${surfaceId}" in ${file} — it has: ${[...surfaces.keys()].join(', ')}`); process.exit(2) }

/* The catalog is read BEFORE the tree, because the tree comes out of it: which
 * properties hold component ids is a fact the schema states. */
const catalogFile = process.argv.find((a) => a.startsWith('--catalog='))?.slice(10) ?? 'catalog.json'
const catalog = JSON.parse(readFileSync(catalogFile, 'utf8'))
const tree = hydrate(buildTree(s.components, 'root', { refs: childRefs(catalog), model: s.model }), s.model)

if (process.argv.includes('--html')) {
  const b = BINDINGS[process.argv.find((a) => a.startsWith('--bind='))?.slice(7) ?? 'kit']
  console.log(walk(tree, (n, k, r, ka) => b.h(n, k, r, ka) ?? `<!-- ${n.component}: not in this binding -->`, s.model))
  process.exit(0)
}

/* The binding's certificate travels WITH the verdict — read from the artefact CI
 * generated, never assumed. No certificate → the verdict says "unverified". */
import { existsSync } from 'node:fs'
const cert = existsSync('binding.json') ? JSON.parse(readFileSync('binding.json', 'utf8')) : null
const proof = describeBinding(cert)
/* The catalog travels with the answer: check() reads the semantics IT declares
 * (x-a11y), plus a sidecar for a catalog we do not own. --a11y=<file> supplies
 * one; --catalog=<file> checks a foreign catalog entirely. */
const sidecarFile = process.argv.find((a) => a.startsWith('--a11y='))?.slice(7)
const a11y = sidecarFile ? JSON.parse(readFileSync(sidecarFile, 'utf8')) : null
const report = check(tree, { catalog, a11y, binding: { id: cert?.binding ?? 'unknown', ...proof } })
const mark = { fail: '✗', 'needs-review': '·', unverified: '?', partial: '◐', AA: '✓' }[report.verdict]
console.log(`\n  ${mark}  ${report.verdict.toUpperCase()} — ${report.why}`)
console.log(`     ${report.counted.nodes} components (${report.counted.annotated} carry semantics) · ${report.counted.rules} rules`)
console.log(`     binding ${cert?.binding ?? 'unknown'}: ${proof.line}\n`)
for (const f of report.findings) {
  const tag = f.severity === 'fail' ? 'FAIL  ' : 'REVIEW'
  console.log(`     ${tag} ${(f.sc ?? 'craft').padEnd(6)} ${f.rule.padEnd(24)} #${f.id}`)
  console.log(`            ${f.message}`)
}
if (!report.findings.length) console.log('     no findings')
if (report.catalogGaps.length) { console.log(`\n     gaps in the CATALOG itself — no renderer or agent can fix these:`)
  for (const g of report.catalogGaps) console.log(`       ${g.sc.padEnd(6)} ${g.message}`) }
if (report.refused.length) console.log(`\n     refused by the catalog (rendered as a refusal, not an accessibility gap): ${report.refused.join(', ')}`)
if (report.unannotated.length) console.log(`\n     rendered but NOT checkable — no x-a11y in the catalog: ${report.unannotated.join(', ')}`)
console.log(`\n     not checked here (never counted as passing):`)
for (const u of report.unchecked) console.log(`       ${u.sc.padEnd(6)} ${u.what}`)
