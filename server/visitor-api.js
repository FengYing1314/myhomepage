
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = Number.parseInt(process.env.VISITOR_PORT || '7000', 10) || 7000
const DATA_DIR = process.env.VISITOR_DATA_DIR || path.join(__dirname, '..', 'data')
const DATA_FILE = path.join(DATA_DIR, 'visitor-counter.json')

async function readState() {
  try {
    const raw = await fs.promises.readFile(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.sequence !== 'number' ||
      typeof parsed.visitors !== 'object' ||
      parsed.visitors === null
    ) {
      throw new Error('Invalid state file')
    }
    return {
      sequence: parsed.sequence,
      visitors: parsed.visitors
    }
  } catch {
    return {
      sequence: 0,
      visitors: {}
    }
  }
}

async function writeState(state) {
  await fs.promises.mkdir(DATA_DIR, { recursive: true })
  const payload = JSON.stringify(state, null, 2)
  await fs.promises.writeFile(DATA_FILE, payload, 'utf8')
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 1024) {
        reject(new Error('Payload too large'))
        req.destroy()
      }
    })
    req.on('end', () => {
      if (!body) {
        resolve({})
        return
      }
      try {
        const parsed = JSON.parse(body)
        resolve(parsed)
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', (error) => {
      reject(error)
    })
  })
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  })
  res.end(body)
}

const server = http.createServer(async (req, res) => {
  const { method, url } = req

  if (!url) {
    sendJson(res, 400, { error: 'Invalid request' })
    return
  }

  if (url.startsWith('/visitor')) {
    if (method === 'OPTIONS') {
      sendJson(res, 200, { ok: true })
      return
    }

    if (method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' })
      return
    }

    try {
      const body = await readJsonBody(req)
      const visitorId = typeof body.visitorId === 'string' ? body.visitorId.trim() : ''

      if (!visitorId) {
        sendJson(res, 400, { error: 'visitorId is required' })
        return
      }

      const state = await readState()
      let index = state.visitors[visitorId]
      let isNew = false

      if (typeof index !== 'number' || index <= 0) {
        state.sequence += 1
        index = state.sequence
        state.visitors[visitorId] = index
        isNew = true
        await writeState(state)
      }

      sendJson(res, 200, {
        index,
        isNew,
        total: state.sequence
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Visitor API error:', error)
      sendJson(res, 500, { error: 'Internal error' })
    }
    return
  }

  if (method === 'OPTIONS') {
    sendJson(res, 200, { ok: true })
    return
  }

  sendJson(res, 404, { error: 'Not found' })
})

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Visitor API listening on port ${PORT}, state file: ${DATA_FILE}`)
})
