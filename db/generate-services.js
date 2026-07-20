// Generates 4 weeks of upcoming ministry services starting from today.
// Safe to run multiple times — skips dates that already exist.
// Usage: node db/generate-services.js

const db = require('./database')

let counter = 0
const uid = () => `s${Date.now()}${++counter}`

function pad(n) { return String(n).padStart(2, '0') }

function toISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Find the next occurrence of a given weekday (0=Sun, 1=Mon ... 6=Sat)
function nextWeekday(from, weekday) {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  const diff = (weekday - d.getDay() + 7) % 7
  d.setDate(d.getDate() + (diff === 0 ? 0 : diff))
  return d
}

const insertService = db.prepare(`
  INSERT OR IGNORE INTO services (id, day, date, time, call_time, title, roles_needed)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

const insertLineup = db.prepare(`
  INSERT OR IGNORE INTO lineups (id, service_id, published)
  VALUES (?, ?, 0)
`)

const WEEKS = 4
const today = new Date()
today.setHours(0, 0, 0, 0)

let added = 0

for (let week = 0; week < WEEKS; week++) {
  const base = new Date(today)
  base.setDate(base.getDate() + week * 7)

  // ── Thursday ───────────────────────────────────────────────
  const thu = nextWeekday(new Date(base), 4)
  if (week > 0 || thu >= today) {
    const date = toISO(thu)
    const roles = JSON.stringify(['Sound Engineer', 'Camera Operator', 'Projection'])
    const svcId = uid()
    const r1 = insertService.run(svcId, 'Thursday', date, '5:00 PM', '4:30 PM', 'Thursday Rehearsal', roles)
    if (r1.changes) { insertLineup.run(uid(), svcId); added++ }
  }

  // ── Friday ─────────────────────────────────────────────────
  const fri = nextWeekday(new Date(base), 5)
  if (week > 0 || fri >= today) {
    const date = toISO(fri)
    const roles = JSON.stringify(['Sound Engineer', 'Camera Operator', 'Projection'])
    const svcId = uid()
    const r2 = insertService.run(svcId, 'Friday', date, '6:30 PM', '6:00 PM', 'Friday Night Service', roles)
    if (r2.changes) { insertLineup.run(uid(), svcId); added++ }
  }

  // ── Sunday First ───────────────────────────────────────────
  const sun = nextWeekday(new Date(base), 0)
  if (week > 0 || sun >= today) {
    const date = toISO(sun)
    const rolesFirst = JSON.stringify(['Sound Engineer', 'Camera Operator', 'Projection', 'Livestream Engineer'])
    const svcId1 = uid()
    const r3 = insertService.run(svcId1, 'Sunday', date, '7:30 AM', '6:45 AM', 'Sunday First Service', rolesFirst)
    if (r3.changes) { insertLineup.run(uid(), svcId1); added++ }

    // ── Sunday Second ────────────────────────────────────────
    const rolesFull = JSON.stringify(['Sound Engineer', 'Camera Operator', 'Projection', 'Livestream Engineer', 'Lighting', 'Photography'])
    const svcId2 = uid()
    const r4 = insertService.run(svcId2, 'Sunday', date, '9:30 AM', '9:00 AM', 'Sunday Second Service', rolesFull)
    if (r4.changes) { insertLineup.run(uid(), svcId2); added++ }
  }
}

if (added > 0) {
  console.log(`\n  ✓ Added ${added} upcoming services.\n`)
} else {
  console.log('\n  No new services needed — all dates already exist.\n')
}
