import { createServer } from 'https'
import next from 'next'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

// Prepare Next.js app
const app = next({ dev, turbopack: true, hostname, port })
const handle = app.getRequestHandler()

// SSL certificate paths
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '.certificates', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '.certificates', 'cert.pem')),
}

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      await handle(req, res)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on https://${hostname}:${port}`)
    })
})
