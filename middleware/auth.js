const jwt = require('jsonwebtoken')
const db  = require('../db/database')

const SECRET = process.env.JWT_SECRET || 'kibucu-media-secret-change-in-production'

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ ok: false, error: 'Authentication required. Please sign in.' })
  }

  try {
    const payload = jwt.verify(token, SECRET)
    const member  = db.prepare('SELECT * FROM members WHERE id = ?').get(payload.id)
    if (!member) {
      return res.status(401).json({ ok: false, error: 'Account not found. Please sign in again.' })
    }
    req.user = member
    next()
  } catch {
    return res.status(401).json({ ok: false, error: 'Session expired. Please sign in again.' })
  }
}

function adminOnly(req, res, next) {
  if (!req.user?.is_admin) {
    return res.status(403).json({ ok: false, error: 'This action requires administrator access.' })
  }
  next()
}

function sign(user) {
  return jwt.sign({ id: user.id, isAdmin: user.is_admin }, SECRET, { expiresIn: '7d' })
}

module.exports = { authMiddleware, adminOnly, sign }
