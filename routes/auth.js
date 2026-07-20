const express = require('express')
const bcrypt  = require('bcryptjs')
const db      = require('../db/database')
const { sign } = require('../middleware/auth')

const router = express.Router()

let _c = 0
const uid = (p) => `${p}${Date.now()}${++_c}`

function normalise(r) { return r.trim().toUpperCase() }

function mmdd(fullDate) {
  // fullDate from <input type="date"> is YYYY-MM-DD; we store only MM-DD.
  const parts = fullDate.split('-')
  return parts.length === 3 ? `${parts[1]}-${parts[2]}` : fullDate
}

function formatMember(m) {
  return {
    id:            m.id,
    name:          m.name,
    regNo:         m.reg_no,
    gender:        m.gender,
    dob:           m.dob,
    email:         m.email,
    phone:         m.phone,
    ministryRoles: JSON.parse(m.ministry_roles || '[]'),
    isAdmin:       m.is_admin === 1,
    avatarVariant: m.avatar_variant,
    bio:           m.bio,
  }
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { regNo, password } = req.body || {}

  if (!regNo || !password) {
    return res.status(400).json({ ok: false, error: 'Registration number and password are required.' })
  }

  const member = db.prepare('SELECT * FROM members WHERE UPPER(TRIM(reg_no)) = ?').get(normalise(regNo))
  if (!member) {
    return res.status(401).json({ ok: false, error: 'No account found with that registration number.' })
  }

  if (!bcrypt.compareSync(password, member.password_hash)) {
    return res.status(401).json({ ok: false, error: 'Incorrect password. Try again.' })
  }

  res.json({ ok: true, token: sign(member), user: formatMember(member) })
})

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { name, phone, email, gender, regNo, dob, password } = req.body || {}

  if (!name || !phone || !email || !gender || !regNo || !password) {
    return res.status(400).json({ ok: false, error: 'Please fill in all required fields.' })
  }
  if (password.length < 6) {
    return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters.' })
  }

  const exists = db.prepare('SELECT id FROM members WHERE UPPER(TRIM(reg_no)) = ?').get(normalise(regNo))
  if (exists) {
    return res.status(409).json({ ok: false, error: 'That registration number is already registered.' })
  }

  const id   = uid('m')
  const hash = bcrypt.hashSync(password, 10)
  const dobStored = mmdd(dob)

  db.prepare(`
    INSERT INTO members (id, name, reg_no, gender, dob, email, phone, password_hash, ministry_roles, is_admin, avatar_variant, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]', 0, 'neutral', '')
  `).run(id, name.trim(), regNo.trim(), gender, dobStored, email.trim(), phone.trim(), hash)

  // Notify admin
  db.prepare(`INSERT INTO inbox_items (id, type, title, body, recipient_role, posted_at) VALUES (?, 'system', ?, ?, 'admin', datetime('now'))`)
    .run(uid('i'), 'New member', `${name.trim()} (${regNo.trim()}) just registered.`)

  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id)
  res.status(201).json({ ok: true, token: sign(member), user: formatMember(member) })
})

module.exports = router
