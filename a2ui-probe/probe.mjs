import { readFileSync } from 'node:fs'
import { applyStream, buildTree, resolve, FUNCTIONS } from './core.mjs'
import { render } from './bind-kit.mjs'
import { check } from './check.mjs'

/** Resolve data-bound lists onto the node, so check() sees the ANSWER, not the pointer. */
function hydrate(node, model) {
  const out = { ...node }
  if (node.items) out.resolvedItems = resolve(node.items, model, null, FUNCTIONS)
  out.kids = (node.kids ?? []).map((k) => hydrate(k, model))
  return out
}

const file = process.argv[2] ?? 'message.jsonl'
const surfaceId = process.argv[3] ?? 'permit_1'
const s = applyStream(readFileSync(file, 'utf8').trim().split('\n')).get(surfaceId)
const tree = hydrate(buildTree(s.components), s.model)

if (process.argv.includes('--html')) { console.log(render(tree, { model: s.model, scope: null })); process.exit(0) }

/* The binding's certificate travels WITH the verdict — read from the artefact CI
 * generated, never assumed. No certificate → the verdict says "unverified". */
import { existsSync } from 'node:fs'
const cert = existsSync('binding.json') ? JSON.parse(readFileSync('binding.json', 'utf8')) : { binding: 'unknown', certified: false }
const report = check(tree, { binding: { id: cert.binding, certified: cert.certified, cert } })
const mark = { fail: '✗', 'needs-review': '·', unverified: '?', AA: '✓' }[report.verdict]
console.log(`\n  ${mark}  ${report.verdict.toUpperCase()} — ${report.why}`)
console.log(`     ${report.counted.nodes} components · ${report.counted.rules} rules`)
if (cert.certified) console.log(`     binding ${cert.binding}: ${cert.pairsChecked} contrast pairs over ${cert.combinations} configurations, all above the floor\n`)
else console.log('')
for (const f of report.findings) {
  const tag = f.severity === 'fail' ? 'FAIL  ' : 'REVIEW'
  console.log(`     ${tag} ${(f.sc ?? 'craft').padEnd(6)} ${f.rule.padEnd(24)} #${f.id}`)
  console.log(`            ${f.message}`)
}
if (!report.findings.length) console.log('     no findings')
console.log(`\n     not checked here (never counted as passing):`)
for (const u of report.unchecked) console.log(`       ${u.sc.padEnd(6)} ${u.what}`)
