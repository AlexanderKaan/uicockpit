#!/usr/bin/env node
/**
 * audit:backticks — name the trap instead of letting tsc describe its symptom.
 *
 * Recipe and global-layer CSS lives inside JS template literals, so a backtick
 * anywhere in a CSS comment terminates the string. TypeScript does catch it, but
 * it reports something like `TS1005: ',' expected` pointing at a line hundreds
 * further down where the parse finally gave up — which is why this has cost time
 * ten separate times in this repo, always while writing a comment about
 * something else.
 *
 * The rule is narrower than "no backticks in comments", and getting that wrong
 * is instructive: the first version flagged 200 lines, because ESCAPED backticks
 * (\\`) are correct and this codebase quotes class names with them constantly. It
 * also flagged the backtick that opens each literal. The real rule is an
 * UNESCAPED backtick inside a comment — which is exactly the mistake, written out:
 * reaching for markdown-style \`.btn\` instead of the escaped form.
 *
 * The check is trivial. Its value is entirely in the error message: the file, the
 * line, and the sentence explaining why the backtick cannot be there bare.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..')

/* The files whose CSS is authored inside template literals. Anywhere else a
 * backtick is ordinary JavaScript and none of our business. */
const FILES = ['src/kit/recipes/index.ts', 'src/kit/globalLayer.ts']

const problems = []

/* Walk the file as a character stream, tracking two states at once. Line-based
 * heuristics could not do this: the previous attempts flagged escaped backticks
 * (correct usage), then the literal's own opening backtick, then every JSDoc
 * comment ABOVE the literals — three wrong models before the right one, which is
 * simply that the bug requires BOTH states to hold. */
for (const rel of FILES) {
  const src = readFileSync(join(ROOT, rel), 'utf8')
  let inLiteral = false
  let inComment = false
  let line = 1

  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (c === '\n') { line++; continue }
    if (c === '\\') { i++; continue } // escaped anything, including \`

    if (inLiteral && !inComment && c === '/' && src[i + 1] === '*') { inComment = true; i++; continue }
    if (inLiteral && inComment && c === '*' && src[i + 1] === '/') { inComment = false; i++; continue }

    if (c === '`') {
      if (inLiteral && inComment) {
        // A bare backtick inside a CSS comment inside the literal: the string
        // ends here and everything after it is parsed as JavaScript.
        problems.push({ file: rel, line, text: src.slice(src.lastIndexOf('\n', i) + 1, src.indexOf('\n', i)).trim().slice(0, 88) })
      }
      inLiteral = !inLiteral
      inComment = false
    }
  }
}

if (problems.length) {
  console.error('\n✗ audit:backticks — backtick inside a CSS comment\n')
  for (const p of problems) {
    console.error(`  ${relative(ROOT, join(ROOT, p.file))}:${p.line}`)
    console.error(`    ${p.text}`)
  }
  console.error(
    '\n  This CSS lives inside a JS template literal, so a backtick ENDS the string.\n' +
    "  TypeScript will report it as a syntax error somewhere far below — that is the\n" +
    '  same bug, described from where the parser gave up. Drop the backticks; the\n' +
    '  surrounding prose reads fine without them.\n',
  )
  process.exit(1)
}

console.log('✓ audit:backticks — no backticks in CSS comments')
