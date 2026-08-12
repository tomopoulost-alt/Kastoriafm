import http from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const DIST = join(__dirname, 'dist')
const PORT = Number(process.env.PORT) || 4173
const BASE_PATH = '/webapp'
const STREAM_HOST = 'eco.onestreaming.com'
const STREAM_PORT = 8107
const STREAM_PATH = '/stream'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function sendFile(res, filePath) {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
    return
  }

  const type = MIME[extname(filePath)] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600' })
  createReadStream(filePath).pipe(res)
}

function proxyStream(clientReq, clientRes) {
  const upstream = http.request(
    {
      hostname: STREAM_HOST,
      port: STREAM_PORT,
      path: STREAM_PATH,
      method: 'GET',
      headers: {
        'User-Agent': clientReq.headers['user-agent'] || 'KastoriaFM-Player',
        'Icy-MetaData': '1',
        Connection: 'keep-alive',
      },
    },
    (upstreamRes) => {
      const headers = {
        'Content-Type': upstreamRes.headers['content-type'] || 'audio/mpeg',
        'Cache-Control': 'no-cache, no-store',
        'Access-Control-Allow-Origin': '*',
      }

      if (upstreamRes.headers['icy-name']) headers['icy-name'] = upstreamRes.headers['icy-name']
      if (upstreamRes.headers['icy-br']) headers['icy-br'] = upstreamRes.headers['icy-br']
      if (upstreamRes.headers['icy-metaint']) {
        headers['icy-metaint'] = upstreamRes.headers['icy-metaint']
      }

      clientRes.writeHead(upstreamRes.statusCode || 200, headers)
      upstreamRes.pipe(clientRes)
    },
  )

  upstream.on('error', (err) => {
    console.error('Stream proxy error:', err.message)
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' })
    }
    clientRes.end('Stream unavailable')
  })

  clientReq.on('close', () => upstream.destroy())
  upstream.end()
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  
  // Handle stream proxy at /webapp/stream
  if (url.pathname === `${BASE_PATH}/stream`) {
    proxyStream(req, res)
    return
  }

  // Strip BASE_PATH from pathname if present
  let pathname = url.pathname
  if (pathname.startsWith(BASE_PATH)) {
    pathname = pathname.substring(BASE_PATH.length) || '/'
  }

  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, '')
  const requested = join(DIST, safePath === '/' ? 'index.html' : safePath)
  const filePath = existsSync(requested) && statSync(requested).isFile()
    ? requested
    : join(DIST, 'index.html')

  sendFile(res, filePath)
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Kastoria FM listening on http://0.0.0.0:${PORT}`)
  console.log(`Base path: ${BASE_PATH}`)
})
