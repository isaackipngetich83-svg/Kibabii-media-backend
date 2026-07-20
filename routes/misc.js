const express = require('express')
const db      = require('../db/database')
const { authMiddleware, adminOnly } = require('../middleware/auth')

let _c = 0
const uid = (p) => `${p}${Date.now()}${++_c}`

const router = express.Router()
router.use(authMiddleware)

// ── Ministry roles ─────────────────────────────────────────
// GET /api/roles
router.get('/roles', (req, res) => {
  const rows = db.prepare('SELECT name FROM roles ORDER BY rowid').all()
  res.json({ ok: true, data: rows.map((r) => r.name) })
})

// POST /api/roles — admin adds a role
router.post('/roles', adminOnly, (req, res) => {
  const { name } = req.body || {}
  if (!name?.trim()) return res.status(400).json({ ok: false, error: 'Role name is required.' })
  const exists = db.prepare('SELECT id FROM roles WHERE name = ?').get(name.trim())
  if (exists) return res.status(409).json({ ok: false, error: `"${name.trim()}" already exists.` })
  db.prepare('INSERT INTO roles (id, name) VALUES (?, ?)').run(uid('r'), name.trim())
  res.status(201).json({ ok: true })
})

// DELETE /api/roles/:name — admin removes a role
router.delete('/roles/:name', adminOnly, (req, res) => {
  db.prepare('DELETE FROM roles WHERE name = ?').run(decodeURIComponent(req.params.name))
  res.json({ ok: true })
})

// ── Slot requests ──────────────────────────────────────────
// GET /api/slots?serviceId=s1 — admin sees all for a service
router.get('/slots', adminOnly, (req, res) => {
  const { serviceId } = req.query
  const rows = serviceId
    ? db.prepare('SELECT * FROM slot_requests WHERE service_id = ?').all(serviceId)
    : db.prepare('SELECT * FROM slot_requests').all()
  res.json({
    ok: true,
    data: rows.map((r) => ({
      id: r.id, memberId: r.member_id, serviceId: r.service_id,
      requestedRoles: JSON.parse(r.requested_roles || '[]'),
      submittedAt: r.submitted_at, reviewed: r.reviewed === 1,
    })),
  })
})

// PUT /api/slots/:id/review — admin marks a request as reviewed
router.put('/slots/:id/review', adminOnly, (req, res) => {
  db.prepare('UPDATE slot_requests SET reviewed = 1 WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router

// GET /api/slots/mine — member sees their own slot requests
router.get('/slots/mine', (req, res) => {
  const rows = db.prepare('SELECT * FROM slot_requests WHERE member_id = ?').all(req.user.id)
  res.json({
    ok: true,
    data: rows.map((r) => ({
      id: r.id, memberId: r.member_id, serviceId: r.service_id,
      requestedRoles: JSON.parse(r.requested_roles || '[]'),
      submittedAt: r.submitted_at, reviewed: r.reviewed === 1,
    })),
  })
})
