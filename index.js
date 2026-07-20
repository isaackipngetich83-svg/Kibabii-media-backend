require('./db/database')   // Initialises tables on first run

const express     = require('express')
const cors        = require('cors')

const app = express()

const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)
const allowedOrigins = envOrigins.length ? envOrigins : defaultOrigins

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (curl, server-to-server, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS blocked for origin: ${origin}`))
  }
}))
app.use(express.json())

// ── Health check ──────────────────────────────────────────────
// Registered before the routes below so it isn't caught by the
// auth middleware inside routes/misc.js (which is mounted at /api).
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Kibucu API is running.' })
})

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'))
app.use('/api/members',      require('./routes/members'))
app.use('/api/services',     require('./routes/services'))
app.use('/api/availability', require('./routes/availability'))
app.use('/api/attendance',   require('./routes/attendance'))
app.use('/api/lineups',      require('./routes/lineups'))
app.use('/api/inbox',        require('./routes/inbox'))
app.use('/api',              require('./routes/misc'))   // /api/roles + /api/slots

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ ok: false, error: `Route ${req.method} ${req.path} not found.` })
})

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ ok: false, error: 'Something went wrong on the server. Please try again.' })
})

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`\n  Kibucu API running on http://localhost:${PORT}`)
  console.log(`  Health check: http://localhost:${PORT}/api/health\n`)
})