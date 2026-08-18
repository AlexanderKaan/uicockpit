/* THE BINDING CERTIFICATE — how binding.json is made, and why it is checked in.
 *
 * The certificate sweeps the kit's theme engine: every theme x mode x density
 * combination, every contrast pair, against the WCAG 1.4.3 / 1.4.11 floors.
 * That engine is not in this project — it belongs to the component library this
 * repository used to be, and dragging 3 200 lines of it along for an artefact
 * that changes once per release would be the exact bloat we just cut.
 *
 * So binding.json is a RELEASE ARTEFACT, checked in, and this is how you make a
 * new one when kit/ changes:
 *
 *     git checkout archive/cockpit-2026-08-17 -- cockpit
 *     cd cockpit && npx vite-node ../a2ui/certify.legacy.ts
 *     git rm -r --cached cockpit && rm -rf cockpit
 *
 * If theming from a single brand colour ever becomes a feature here, the engine
 * comes back deliberately and trimmed — not by accident, and not as a leftover.
 * Until then: what the certificate claims was measured on 2026-08-17, and the
 * date is in the file.
 */
export {}
