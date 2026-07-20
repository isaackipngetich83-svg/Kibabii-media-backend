const express = require('express')
const db      = require('../db/database')
const { authMiddleware, adminOnly } = require('../middleware/auth')

let _c = 0
const uid = (p) => `${p}${Date.now()}${++_c}`

const router = express.Router()
router.use(authMiddleware)

function getLineup(serviceId) {
  const lineup = db.prepare('SELECT * FROM lineups WHERE service_id = ?').get(serviceId)
  if (!lineup) return null
  const assignments = db.prepare('SELECT role, member_id FROM lineup_assignments WHERE lineup_id = ?').all(lineup.id)
  const assignMap = {}
  assignments.forEach((a) => { assignMap[a.role] = a.member_id || null })
  return { serviceId: lineup.service_id, published: lineup.published === 1, assignments: assignMap }
}

// GET /api/lineups?serviceId=s1  or  GET /api/lineups (all)
router.get('/', (req, res) => {
  const { serviceId } = req.query
  if (serviceId) {
    const l = getLineup(serviceId)
    // Non-admin only sees published lineups
    if (!req.user.is_admin && l && !l.published) return res.json({ ok: true, data: null })
    return res.json({ ok: true, data: l })
  }
  const services = db.prepare('SELECT id FROM services').all()
  const all = {}
  services.forEach(({ id }) => {
    const l = getLineup(id)
    if (l && (req.user.is_admin || l.published)) all[id] = l
  })
  res.json({ ok: true, data: all })
})

// PUT /api/lineups/assign — admin assigns a role
router.put('/assign', adminOnly, (req, res) => {
  const { serviceId, role, memberId } = req.body || {}
  if (!serviceId || !role) return res.status(400).json({ ok: false, error: 'serviceId and role are required.' })

  const lineup = db.prepare('SELECT id FROM lineups WHERE service_id = ?').get(serviceId)
  if (!lineup) return res.status(404).json({ ok: false, error: 'Lineup not found for that service.' })

  db.prepare(`
    INSERT INTO lineup_assignments (id, lineup_id, role, member_id)
    VALUES (?, ?, ?, ?)
    ON CONFLICT (lineup_id, role)
    DO UPDATE SET member_id = excluded.member_id
  `).run(uid('la'), lineup.id, role, memberId || null)

  res.json({ ok: true })
})

// PUT /api/lineups/publish — admin publishes or unpublishes
router.put('/publish', adminOnly, (req, res) => {
  const { serviceId, published } = req.body || {}
  if (!serviceId) return res.status(400).json({ ok: false, error: 'serviceId is required.' })

  db.prepare(`UPDATE lineups SET published = ?, updated_at = datetime('now') WHERE service_id = ?`)
    .run(published ? 1 : 0, serviceId)

  if (published) {
    const lineup  = getLineup(serviceId)
    const service = db.prepare('SELECT title, date FROM services WHERE id = ?').get(serviceId)
    Object.entries(lineup?.assignments || {}).forEach(([role, memberId]) => {
      if (!memberId) return
      db.prepare(`INSERT INTO inbox_items (id, type, title, body, recipient_id, posted_at) VALUES (?, 'lineup', ?, ?, ?, datetime('now'))`)
        .run(uid('i'), "You're on the lineup", `${role} · ${service?.title} · ${service?.date}`, memberId)
    })
  }

  res.json({ ok: true })
})

module.exports = router
