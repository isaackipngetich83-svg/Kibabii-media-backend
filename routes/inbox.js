const express = require('express')
const db      = require('../db/database')
const { authMiddleware, adminOnly } = require('../middleware/auth')

let _c = 0
const uid = (p) => `${p}${Date.now()}${++_c}`

const router = express.Router()
router.use(authMiddleware)

function mmdd(date) {
  return `${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

// GET /api/inbox — items visible to the current user
router.get('/', (req, res) => {
  const user = req.user

  // Broadcast items (recipient_id IS NULL) + items addressed to this user
  // + admin-role items (if admin)
  let rows
  if (user.is_admin) {
    rows = db.prepare(`
      SELECT * FROM inbox_items
      WHERE recipient_id IS NULL
         OR recipient_id = ?
         OR recipient_role = 'admin'
      ORDER BY posted_at DESC
    `).all(user.id)
  } else {
    rows = db.prepare(`
      SELECT * FROM inbox_items
      WHERE (recipient_id IS NULL AND recipient_role IS NULL)
         OR recipient_id = ?
      ORDER BY posted_at DESC
    `).all(user.id)
  }

  // Which items has this user already read?
  const readSet = new Set(
    db.prepare('SELECT item_id FROM inbox_reads WHERE member_id = ?').all(user.id).map((r) => r.item_id)
  )

  // Birthday items (computed, not stored)
  const today   = mmdd(new Date())
  const members = db.prepare('SELECT id, name, dob FROM members WHERE dob = ?').all(today)
  const bdays   = members.map((m) => ({
    id:           `bday-${m.id}`,
    type:         'birthday',
    title:        `Happy Birthday, ${m.name.split(' ')[0]}! 🎂`,
    body:         `Wishing ${m.name} a wonderful day. Thank you for everything you bring to the ministry.`,
    recipient_id: null,
    posted_at:    new Date().toISOString(),
    read:         false,
  }))

  const items = rows.map((item) => ({
    ...item,
    imageUrl: item.image_url,
    posted_at: (item.posted_at || '').replace(' ', 'T'),
    read: readSet.has(item.id),
  }))
  res.json({ ok: true, data: [...bdays, ...items] })
})

// PUT /api/inbox/:id/read
router.put('/:id/read', (req, res) => {
  db.prepare(`
    INSERT OR IGNORE INTO inbox_reads (member_id, item_id, read_at)
    VALUES (?, ?, datetime('now'))
  `).run(req.user.id, req.params.id)
  res.json({ ok: true })
})

// PUT /api/inbox/read-all
router.put('/read-all/all', (req, res) => {
  const user = req.user
  let rows
  if (user.is_admin) {
    rows = db.prepare(`SELECT id FROM inbox_items WHERE recipient_id IS NULL OR recipient_id = ? OR recipient_role = 'admin'`).all(user.id)
  } else {
    rows = db.prepare(`SELECT id FROM inbox_items WHERE (recipient_id IS NULL AND recipient_role IS NULL) OR recipient_id = ?`).all(user.id)
  }
  const ins = db.prepare(`INSERT OR IGNORE INTO inbox_reads (member_id, item_id, read_at) VALUES (?, ?, datetime('now'))`)
  rows.forEach((r) => ins.run(user.id, r.id))
  res.json({ ok: true })
})

// POST /api/inbox — admin posts an announcement or event
router.post('/', adminOnly, (req, res) => {
  const { type, title, body, imageUrl = '' } = req.body || {}
  if (!type || !title || !body) {
    return res.status(400).json({ ok: false, error: 'type, title, and body are required.' })
  }
  const id = uid('i')
  db.prepare(`INSERT INTO inbox_items (id, type, title, body, image_url, posted_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`)
    .run(id, type, title, body, imageUrl || null)
  res.status(201).json({ ok: true, id })
})

// DELETE /api/inbox/:id — admin deletes a post
router.delete('/:id', adminOnly, (req, res) => {
  db.prepare('DELETE FROM inbox_items WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router
