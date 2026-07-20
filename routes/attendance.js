const express = require('express')
const db      = require('../db/database')
const { authMiddleware, adminOnly } = require('../middleware/auth')

let _c = 0
const uid = (p) => `${p}${Date.now()}${++_c}`

const router = express.Router()
router.use(authMiddleware)

function isToday(dateStr) {
  const today  = new Date()
  const target = new Date(`${dateStr}T00:00:00`)
  return today.getFullYear() === target.getFullYear() &&
    today.getMonth() === target.getMonth() &&
    today.getDate()  === target.getDate()
}

function fmt(r) {
  return { memberId: r.member_id, serviceId: r.service_id, attended: r.attended === 1, markedAt: r.marked_at }
}

// GET /api/attendance?serviceId=s1
router.get('/', (req, res) => {
  const { serviceId } = req.query
  if (req.user.is_admin) {
    const rows = serviceId
      ? db.prepare('SELECT * FROM attendance WHERE service_id = ?').all(serviceId)
      : db.prepare('SELECT * FROM attendance').all()
    return res.json({ ok: true, data: rows.map(fmt) })
  }
  const rows = serviceId
    ? db.prepare('SELECT * FROM attendance WHERE member_id = ? AND service_id = ?').all(req.user.id, serviceId)
    : db.prepare('SELECT * FROM attendance WHERE member_id = ?').all(req.user.id)
  res.json({ ok: true, data: rows.map(fmt) })
})

// POST /api/attendance — member marks themselves; today only
router.post('/', (req, res) => {
  const { serviceId } = req.body || {}
  if (!serviceId) return res.status(400).json({ ok: false, error: 'serviceId is required.' })

  const service = db.prepare('SELECT date FROM services WHERE id = ?').get(serviceId)
  if (!service) return res.status(404).json({ ok: false, error: 'Service not found.' })
  if (!isToday(service.date)) {
    return res.status(400).json({ ok: false, error: 'Attendance can only be marked on the day of the service.' })
  }

  db.prepare(`
    INSERT INTO attendance (id, member_id, service_id, attended, marked_at)
    VALUES (?, ?, ?, 1, datetime('now'))
    ON CONFLICT (member_id, service_id)
    DO UPDATE SET attended = 1, marked_at = datetime('now')
  `).run(uid('at'), req.user.id, serviceId)

  res.json({ ok: true })
})

// DELETE /api/attendance/:serviceId — member unmarks; today only
router.delete('/:serviceId', (req, res) => {
  const service = db.prepare('SELECT date FROM services WHERE id = ?').get(req.params.serviceId)
  if (!service) return res.status(404).json({ ok: false, error: 'Service not found.' })
  if (!isToday(service.date)) {
    return res.status(400).json({ ok: false, error: 'Attendance can only be changed on the day of the service.' })
  }
  db.prepare('DELETE FROM attendance WHERE member_id = ? AND service_id = ?').run(req.user.id, req.params.serviceId)
  res.json({ ok: true })
})

// PUT /api/attendance/admin — admin corrects any record
router.put('/admin', adminOnly, (req, res) => {
  const { memberId, serviceId, attended } = req.body || {}
  if (!memberId || !serviceId) return res.status(400).json({ ok: false, error: 'memberId and serviceId are required.' })

  if (!attended) {
    db.prepare('DELETE FROM attendance WHERE member_id = ? AND service_id = ?').run(memberId, serviceId)
  } else {
    db.prepare(`
      INSERT INTO attendance (id, member_id, service_id, attended, marked_at)
      VALUES (?, ?, ?, 1, datetime('now'))
      ON CONFLICT (member_id, service_id)
      DO UPDATE SET attended = 1, marked_at = datetime('now')
    `).run(uid('at'), memberId, serviceId)
  }
  res.json({ ok: true })
})

module.exports = router
