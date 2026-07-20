const express = require('express')
const db      = require('../db/database')
const { authMiddleware, adminOnly } = require('../middleware/auth')

let _c = 0
const uid = (p) => `${p}${Date.now()}${++_c}`

const router = express.Router()
router.use(authMiddleware)

function fmt(row) {
  return { memberId: row.member_id, serviceId: row.service_id, status: row.status, note: row.note }
}

// GET /api/availability?serviceId=s1  — admin sees all; member sees own
router.get('/', (req, res) => {
  const { serviceId } = req.query
  if (req.user.is_admin) {
    const q = serviceId
      ? db.prepare('SELECT * FROM availability WHERE service_id = ?').all(serviceId)
      : db.prepare('SELECT * FROM availability').all()
    return res.json({ ok: true, data: q.map(fmt) })
  }
  const q = serviceId
    ? db.prepare('SELECT * FROM availability WHERE member_id = ? AND service_id = ?').all(req.user.id, serviceId)
    : db.prepare('SELECT * FROM availability WHERE member_id = ?').all(req.user.id)
  res.json({ ok: true, data: q.map(fmt) })
})

// POST /api/availability — upsert a member's response + optional slot request
router.post('/', (req, res) => {
  const { serviceId, status, note = '', preferredRoles = [] } = req.body || {}

  if (!serviceId || !status) {
    return res.status(400).json({ ok: false, error: 'serviceId and status are required.' })
  }
  if (status === 'unavailable' && !note.trim()) {
    return res.status(400).json({ ok: false, error: 'Please provide a reason for being unavailable.' })
  }

  const memberId = req.user.id

  // Upsert availability
  db.prepare(`
    INSERT INTO availability (id, member_id, service_id, status, note, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT (member_id, service_id)
    DO UPDATE SET status = excluded.status, note = excluded.note, updated_at = excluded.updated_at
  `).run(uid('av'), memberId, serviceId, status, note)

  // Slot request if available + roles given
  if (status === 'available' && preferredRoles.length) {
    db.prepare(`
      INSERT INTO slot_requests (id, member_id, service_id, requested_roles, submitted_at, reviewed)
      VALUES (?, ?, ?, ?, datetime('now'), 0)
      ON CONFLICT (member_id, service_id)
      DO UPDATE SET requested_roles = excluded.requested_roles, submitted_at = excluded.submitted_at, reviewed = 0
    `).run(uid('sr'), memberId, serviceId, JSON.stringify(preferredRoles))
  }

  // Notify admin
  const member  = db.prepare('SELECT name FROM members WHERE id = ?').get(memberId)
  const service = db.prepare('SELECT title FROM services WHERE id = ?').get(serviceId)
  const roleHint = preferredRoles.length ? ` — wants: ${preferredRoles.join(', ')}` : ''
  db.prepare(`INSERT INTO inbox_items (id, type, title, body, recipient_role, posted_at) VALUES (?, 'system', ?, ?, 'admin', datetime('now'))`)
    .run(uid('i'), 'Availability received', `${member?.name} is ${status} for ${service?.title}${roleHint}.`)

  res.json({ ok: true })
})

module.exports = router
