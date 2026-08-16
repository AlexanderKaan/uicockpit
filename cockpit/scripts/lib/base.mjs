/**
 * The ONE place the dev server's address is written down.
 *
 * Twelve gate scripts each carried the literal BASE. That is
 * Vite's default port, so any other Vite project open on the machine takes it
 * first — and it happened: another session's dev server was on 5173, ours could
 * not start, and the fix on offer was to kill a process that was not ours.
 *
 * So the project has its OWN port, strict (a mismatch fails loudly instead of the
 * server drifting to 5174 while every gate keeps knocking on 5173), and every
 * script imports the address from here. Override for a one-off:
 *
 *   UIC_BASE=http://localhost:4321 npm run a11y:matrix
 */
export const PORT = Number(process.env.UIC_PORT ?? 5180)
export const BASE = process.env.UIC_BASE ?? `http://localhost:${PORT}`
export const APP = `${BASE}/app`
