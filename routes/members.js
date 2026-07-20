const express = require('express')
const db      = require('../db/database')
const { authMiddleware, adminOnly } = require('../middleware/auth')

const router = express.Router()
router.use(authMiddleware)

function fmt(m) {
  return {
    id: m.id, name: m.name, regNo: m.reg_no, gender: m.gender, dob: m.dob,
    email: m.email, phone: m.phone, ministryRoles: JSON.parse(m.ministry_roles || '[]'),
    isAdmin: m.is_admin === 1, avatarVariant: m.avatar_variant, bio: m.bio,
  }
}

// GET /api/members — admin sees all, member sees only themselves
router.get('/', (req, res) => {
  if (req.user.is_admin) {
    const rows = db.prepare('SELECT * FROM members ORDER BY name').all()
    return res.json({ ok: true, data: rows.map(fmt) })
  }
  const m = db.prepare('SELECT * FROM members WHERE id = ?').get(req.user.id)
  res.json({ ok: true, data: [fmt(m)] })
})

// DELETE /api/members/:id — admin only, cannot delete self
router.delete('/:id', adminOnly, (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ ok: false, error: 'You cannot remove your own account.' })
  }
  db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router
