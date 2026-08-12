import http from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, 'wordpress', 'webapp-live')
const PORT = Number(process.env.PORT) || 4173
const STREAM_HOST = 'eco.onestreaming.com'
const STREAM_PORT = 8107
const STREAM_PATHS = ['/stream', '/;', '/stream/1/']

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
}

function sendFile(res, filePath) {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
    return
  }
  const type = MIME[extname(filePath)] || 'application/octet-stream'
  const noCache = filePath.endsWith('sw.js') || filePath.endsWith('index.html')
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': noCache ? 'no-cache' : 'public, max-age=3600',
  })
  createReadStream(filePath).pipe(res)
}

function proxyStream(clientReq, clientRes, pathIndex = 0) {
  if (pathIndex >= STREAM_PATHS.length) {
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' })
    }
    clientRes.end('Stream unavailable')
    return
  }

  const upstream = http.request(
    {
      hostname: STREAM_HOST,
      port: STREAM_PORT,
      path: STREAM_PATHS[pathIndex],
      method: 'GET',
      headers: {
        'User-Agent': clientReq.headers['user-agent'] || 'KastoriaFM-Player',
        'Icy-MetaData': '0',
        Connection: 'keep-alive',
      },
    },
    (upstreamRes) => {
      if ((upstreamRes.statusCode || 500) >= 400) {
        upstreamRes.resume()
        proxyStream(clientReq, clientRes, pathIndex + 1)
        return
      }
      const headers = {
        'Content-Type': upstreamRes.headers['content-type'] || 'audio/mpeg',
        'Cache-Control': 'no-cache, no-store',
        'Access-Control-Allow-Origin': '*',
        'Connection': 'keep-alive',
      }
      clientRes.writeHead(upstreamRes.statusCode || 200, headers)
      upstreamRes.pipe(clientRes)
    },
  )

  upstream.on('error', () => {
    proxyStream(clientReq, clientRes, pathIndex + 1)
  })

  clientReq.on('close', () => upstream.destroy())
  upstream.end()
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const path = url.pathname

  if (
    path === '/stream' ||
    path === '/webapp/stream' ||
    path === '/webapp/stream.php' ||
    path === '/stream.php'
  ) {
    proxyStream(req, res)
    return
  }

  let rel = path
  if (rel === '/' || rel === '/webapp' || rel === '/webapp/') rel = '/index.html'
  if (rel.startsWith('/webapp/')) rel = rel.slice('/webapp'.length)
  const safe = normalize(rel).replace(/^(\.\.[/\\])+/, '')
  sendFile(res, join(ROOT, safe))
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Kastoria FM listening on http://0.0.0.0:${PORT}`)
})
