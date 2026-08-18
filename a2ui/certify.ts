/* THE BINDING CERTIFICATE — how binding.json is made, and why it is checked in.
 *
 * The certificate sweeps the kit's theme engine: every theme x mode x density
 * combination, every contrast pair, against the WCAG 1.4.3 / 1.4.11 floors.
 * That engine is not in this project — it belongs to the component library this
 * repository used to be, and dragging 3 200 lines of it along for an artefact
 * that changes once per release would be the exact bloat we just cut.
 *
 * So binding.json is a RELEASE ARTEFACT, checked in, and this is how you make a
 * new one when kit/ changes. The token engine has no npm dependencies, so node's
 * own type stripping is the whole toolchain — no install, which matters because
 * the archived package tree no longer resolves:
 *
 *     git worktree add /tmp/arch archive/cockpit-2026-08-17
 *     cp certify.legacy.ts /tmp/arch/cockpit/certify.run.ts
 *     cat > /tmp/arch/cockpit/ts-loader.mjs <<'EOF'
 *     import { register } from 'node:module'
 *     register('data:text/javascript,' + encodeURIComponent(`
 *     export async function resolve(spec, ctx, next) {
 *       if (spec.startsWith('.') && !/\.[a-z]+$/i.test(spec)) {
 *         try { return await next(spec + '.ts', ctx) } catch {}
 *       }
 *       return next(spec, ctx)
 *     }`), import.meta.url)
 *     EOF
 *     cd /tmp/arch/cockpit && mkdir -p ../a2ui
 *     node --experimental-strip-types --import ./ts-loader.mjs certify.run.ts
 *     cp ../a2ui/binding.json <this repo>/a2ui/binding.json
 *     git worktree remove --force /tmp/arch
 *
 * The pair list lives in certify.legacy.ts, not in the archived engine: the
 * A2UI Basic Catalog made the kit render controls the library never had (a
 * checked checkbox, a selected tab, a slider track), and those pairs are ours
 * to assert. One of them fails — see binding.json, and leave it failing until
 * the token engine gains a non-text floor for --k-primary.
 *
 * If theming from a single brand colour ever becomes a feature here, the engine
 * comes back deliberately and trimmed — not by accident, and not as a leftover.
 * Until then: what the certificate claims was measured on 2026-08-17, and the
 * date is in the file.
 */
export {}
