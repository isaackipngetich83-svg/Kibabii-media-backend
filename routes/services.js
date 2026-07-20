const express = require('express')
const db      = require('../db/database')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()
router.use(authMiddleware)

function fmt(s) {
  return {
    id: s.id, day: s.day, date: s.date, time: s.time,
    callTime: s.call_time, title: s.title,
    rolesNeeded: JSON.parse(s.roles_needed || '[]'),
  }
}

// GET /api/services
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM services ORDER BY date, time').all()
  res.json({ ok: true, data: rows.map(fmt) })
})

module.exports = router
