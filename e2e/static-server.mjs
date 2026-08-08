#!/usr/bin/env node
/**
 * Minimal static file server for the parity harness.
 *
 * This runs as its own process on purpose. The harness drives the browser with
 * synchronous child_process calls, which block Node's event loop — an
 * in-process server would be unable to answer the browser's requests while the
 * harness waits for it, deadlocking every page load.
 *
 * Usage: node e2e/static-server.mjs <dir> <port>
 * Prints "ready <port>" on stdout once listening.
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve } from 'node:path'

const dir = resolve(process.argv[2])
const port = Number(process.argv[3])

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.txt': 'text/plain', '.webmanifest': 'application/manifest+json',
}

function resolvePath(urlPath) {
  const candidate = join(dir, urlPath)
  if (!candidate.startsWith(dir)) return null // path traversal
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  // Nuxt's static output writes routes as <route>/index.html.
  const asIndex = join(candidate, 'index.html')
  if (existsSync(asIndex)) return asIndex
  const asHtml = `${candidate.replace(/\/$/, '')}.html`
  if (existsSync(asHtml)) return asHtml
  return null
}

createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0])
  const path = resolvePath(urlPath)
  if (!path) {
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('not found')
    return
  }
  res.writeHead(200, { 'content-type': MIME[extname(path)] || 'application/octet-stream' })
  createReadStream(path).pipe(res)
}).listen(port, '127.0.0.1', () => {
  console.log(`ready ${port}`)
})
