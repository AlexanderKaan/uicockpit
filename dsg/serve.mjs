/* The dev server: static, zero dependencies, two routes.
 *   /            home.html      the proposition
 *   /generator   generator.html the tool
 * Both are built files — `npm run page` and `npm run home` make them. */
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { extname, join } from 'node:path'

const PORT = Number(process.env.PORT ?? 5174)
const ROUTES = { '/': 'home.html', '/generator': 'generator.html', '/wall': 'wall.html' }
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' }

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const file = ROUTES[url.pathname] ?? url.pathname.slice(1)
  const path = join(process.cwd(), file)
  if (!path.startsWith(process.cwd()) || !existsSync(path)) {
    res.writeHead(404, { 'content-type': 'text/html' })
    return res.end(`<body style="font:14px/1.6 system-ui;padding:40px;background:#efeeec">
      <p>Nothing at <code>${url.pathname}</code>.</p>
      <p>Built pages: ${Object.keys(ROUTES).map((r) => `<a href="${r}">${r}</a>`).join(' · ')}</p>
      <p style="color:#6b6862">If one 404s, it has not been built yet — <code>npm run home</code> or <code>npm run page</code>.</p>`)
  }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'text/plain', 'cache-control': 'no-store' })
  res.end(readFileSync(path))
}).listen(PORT, () => console.log(`http://localhost:${PORT}  —  / and /generator`))
