const bcrypt = require('bcryptjs')
const db     = require('./database')

// ── helpers ──────────────────────────────────────────────────────
let c = 0
const uid = (prefix) => `${prefix}${Date.now()}${++c}`

function run(fn) {
  const tx = db.transaction(fn)
  tx()
}

// ── Check if already seeded ───────────────────────────────────────
const existing = db.prepare('SELECT COUNT(*) as n FROM members').get()
if (existing.n > 0) {
  console.log('Database already seeded. Skipping.')
  process.exit(0)
}

console.log('Seeding database…')

// ── Roles ─────────────────────────────────────────────────────────
const ROLES = [
  'Sound Engineer', 'Camera Operator', 'Projection',
  'Livestream Engineer', 'Lighting', 'Photography',
]

run(() => {
  const insertRole = db.prepare('INSERT INTO roles (id, name) VALUES (?, ?)')
  ROLES.forEach((name) => insertRole.run(uid('role'), name))
})

// ── Members ────────────────────────────────────────────────────────
const MEMBERS = [
  { id: 'm1', name: 'Faith Wanjiru',   regNo: 'COM/0110/24',  gender: 'Female', dob: '03-15', email: 'faith.wanjiru@kibucumedia.org',   phone: '0712 334 551', password: 'kibucu123', roles: ['Sound Engineer'],                   isAdmin: 0, variant: 'primary',  bio: 'Mixes the sound desk every Sunday — balancing vocals and instruments so every word lands clearly.' },
  { id: 'm2', name: 'Brian Otieno',    regNo: 'COM/0144/23',  gender: 'Male',   dob: '11-04', email: 'brian.otieno@kibucumedia.org',    phone: '0723 110 982', password: 'kibucu123', roles: ['Camera Operator'],                  isAdmin: 0, variant: 'accent',   bio: 'Frames and follows the service on camera, shaping how the congregation experiences each moment.' },
  { id: 'm3', name: 'Joy Chebet',      regNo: 'BBM/0212/24',  gender: 'Female', dob: '09-08', email: 'joy.chebet@kibucumedia.org',      phone: '0701 558 213', password: 'kibucu123', roles: ['Projection'],                       isAdmin: 0, variant: 'critical', bio: 'Runs lyrics and sermon slides live, keeping worship and the Word in step.' },
  { id: 'm4', name: 'Kevin Mwangi',    regNo: 'COM/0098/22',  gender: 'Male',   dob: '01-22', email: 'kevin.mwangi@kibucumedia.org',    phone: '0733 902 447', password: 'kibucu123', roles: ['Livestream Engineer'],               isAdmin: 0, variant: 'neutral',  bio: 'Keeps the livestream online and steady for members and family joining remotely.' },
  { id: 'm5', name: 'Lilian Achieng',  regNo: 'EDU/0301/23',  gender: 'Female', dob: '07-30', email: 'lilian.achieng@kibucumedia.org',  phone: '0745 211 309', password: 'kibucu123', roles: ['Lighting'],                         isAdmin: 0, variant: 'primary',  bio: 'Shapes the lighting for every service, setting the mood from worship to sermon.' },
  { id: 'm6', name: 'Dennis Kiplangat',regNo: 'COM/0177/24',  gender: 'Male',   dob: '06-23', email: 'dennis.kiplangat@kibucumedia.org',phone: '0719 664 028', password: 'kibucu123', roles: ['Photography'],                      isAdmin: 0, variant: 'accent',   bio: 'Captures the moments worth remembering — worship, baptisms, and fellowship.' },
  { id: 'm7', name: 'Sharon Nyambura', regNo: 'BBM/0056/23',  gender: 'Female', dob: '04-17', email: 'sharon.nyambura@kibucumedia.org', phone: '0700 887 215', password: 'kibucu123', roles: ['Camera Operator','Photography'],     isAdmin: 0, variant: 'critical', bio: 'Splits time between camera and photography, covering services from more than one angle.' },
  { id: 'm8', name: 'Mercy Jepkosgei', regNo: 'COM/0203/22',  gender: 'Female', dob: '12-01', email: 'mercy.jepkosgei@kibucumedia.org', phone: '0728 441 670', password: 'kibucu123', roles: ['Sound Engineer','Projection'],       isAdmin: 0, variant: 'neutral',  bio: 'Steps in on sound or projection wherever the rota needs her most that week.' },
  { id: 'm9', name: 'Samuel Kiptoo',   regNo: 'STAFF/0009/19',gender: 'Male',   dob: '08-14', email: 'samuel.kiptoo@kibucumedia.org',   phone: '0710 220 884', password: 'kibucu123', roles: ['Media Coordinator'],                isAdmin: 1, variant: 'primary',  bio: 'Coordinates the whole Media Ministry — schedules, equipment, and the team behind both.' },
]

run(() => {
  const ins = db.prepare(`
    INSERT INTO members (id, name, reg_no, gender, dob, email, phone, password_hash, ministry_roles, is_admin, avatar_variant, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  MEMBERS.forEach((m) => {
    const hash = bcrypt.hashSync(m.password, 10)
    ins.run(m.id, m.name, m.regNo, m.gender, m.dob, m.email, m.phone, hash, JSON.stringify(m.roles), m.isAdmin, m.variant, m.bio)
  })
})

// ── Services ──────────────────────────────────────────────────────
const SERVICES = [
  { id: 's1', day: 'Thursday', date: '2026-06-18', time: '5:00 PM',  callTime: '4:30 PM', title: 'Thursday Rehearsal',     roles: ['Sound Engineer','Camera Operator','Projection'] },
  { id: 's2', day: 'Sunday',   date: '2026-06-21', time: '7:30 AM',  callTime: '6:45 AM', title: 'Sunday First Service',   roles: ['Sound Engineer','Camera Operator','Projection','Livestream Engineer'] },
  { id: 's3', day: 'Sunday',   date: '2026-06-21', time: '9:30 AM',  callTime: '9:00 AM', title: 'Sunday Second Service',  roles: ['Sound Engineer','Camera Operator','Projection','Livestream Engineer','Lighting','Photography'] },
  { id: 's4', day: 'Thursday', date: '2026-06-25', time: '5:00 PM',  callTime: '4:30 PM', title: 'Thursday Rehearsal',     roles: ['Sound Engineer','Camera Operator','Projection'] },
  { id: 's5', day: 'Friday',   date: '2026-06-26', time: '6:30 PM',  callTime: '6:00 PM', title: 'Friday Night Service',   roles: ['Sound Engineer','Camera Operator','Projection'] },
  { id: 's6', day: 'Sunday',   date: '2026-06-28', time: '7:30 AM',  callTime: '6:45 AM', title: 'Sunday First Service',   roles: ['Sound Engineer','Camera Operator','Projection','Livestream Engineer'] },
  { id: 's7', day: 'Sunday',   date: '2026-06-28', time: '9:30 AM',  callTime: '9:00 AM', title: 'Sunday Second Service',  roles: ['Sound Engineer','Camera Operator','Projection','Livestream Engineer','Lighting','Photography'] },
  { id: 's8', day: 'Friday',   date: '2026-07-03', time: '6:30 PM',  callTime: '6:00 PM', title: 'Friday Night Service',   roles: ['Sound Engineer','Camera Operator','Projection'] },
]

run(() => {
  const ins = db.prepare(`INSERT INTO services (id, day, date, time, call_time, title, roles_needed) VALUES (?, ?, ?, ?, ?, ?, ?)`)
  SERVICES.forEach((s) => ins.run(s.id, s.day, s.date, s.time, s.callTime, s.title, JSON.stringify(s.roles)))
})

// ── Lineups ───────────────────────────────────────────────────────
const LINEUPS = {
  s1: { published: 1, assignments: { 'Sound Engineer': 'm1', 'Camera Operator': 'm2', 'Projection': 'm8' } },
  s2: { published: 1, assignments: { 'Sound Engineer': 'm1', 'Camera Operator': 'm2', 'Projection': 'm3', 'Livestream Engineer': 'm4' } },
  s3: { published: 0, assignments: { 'Sound Engineer': 'm1', 'Camera Operator': 'm7', 'Projection': 'm3', 'Livestream Engineer': null, 'Lighting': null, 'Photography': 'm6' } },
  s4: { published: 0, assignments: { 'Sound Engineer': null, 'Camera Operator': null, 'Projection': null } },
  s5: { published: 0, assignments: { 'Sound Engineer': null, 'Camera Operator': null, 'Projection': null } },
  s6: { published: 0, assignments: { 'Sound Engineer': null, 'Camera Operator': null, 'Projection': null, 'Livestream Engineer': null } },
  s7: { published: 0, assignments: { 'Sound Engineer': null, 'Camera Operator': null, 'Projection': null, 'Livestream Engineer': null, 'Lighting': null, 'Photography': null } },
  s8: { published: 0, assignments: { 'Sound Engineer': null, 'Camera Operator': null, 'Projection': null } },
}

run(() => {
  const insLineup = db.prepare('INSERT INTO lineups (id, service_id, published) VALUES (?, ?, ?)')
  const insAssign = db.prepare('INSERT INTO lineup_assignments (id, lineup_id, role, member_id) VALUES (?, ?, ?, ?)')
  Object.entries(LINEUPS).forEach(([serviceId, lineup]) => {
    const lineupId = uid('l')
    insLineup.run(lineupId, serviceId, lineup.published)
    Object.entries(lineup.assignments).forEach(([role, memberId]) => {
      insAssign.run(uid('la'), lineupId, role, memberId || null)
    })
  })
})

// ── Availability ──────────────────────────────────────────────────
const AVAILABILITY = {
  'm1:s2': { status: 'available',   note: '' },
  'm2:s2': { status: 'available',   note: '' },
  'm3:s2': { status: 'available',   note: '' },
  'm4:s2': { status: 'available',   note: '' },
  'm5:s2': { status: 'unavailable', note: 'Traveling upcountry' },
  'm6:s2': { status: 'available',   note: '' },
  'm8:s2': { status: 'available',   note: '' },
  'm1:s3': { status: 'available',   note: '' },
  'm4:s3': { status: 'unavailable', note: 'Has another commitment' },
  'm6:s3': { status: 'available',   note: '' },
  'm7:s3': { status: 'available',   note: '' },
}

run(() => {
  const ins = db.prepare('INSERT INTO availability (id, member_id, service_id, status, note) VALUES (?, ?, ?, ?, ?)')
  Object.entries(AVAILABILITY).forEach(([key, val]) => {
    const [memberId, serviceId] = key.split(':')
    ins.run(uid('av'), memberId, serviceId, val.status, val.note)
  })
})

// ── Attendance ────────────────────────────────────────────────────
const ATTENDANCE = {
  'm1:s1': '2026-06-18T17:05:00', 'm2:s1': '2026-06-18T17:02:00',
  'm6:s1': '2026-06-18T17:10:00', 'm7:s1': '2026-06-18T17:01:00',
  'm1:s2': '2026-06-21T06:50:00', 'm2:s2': '2026-06-21T06:48:00',
  'm4:s2': '2026-06-21T06:52:00', 'm8:s3': '2026-06-21T09:05:00',
}

run(() => {
  const ins = db.prepare('INSERT INTO attendance (id, member_id, service_id, attended, marked_at) VALUES (?, ?, ?, 1, ?)')
  Object.entries(ATTENDANCE).forEach(([key, markedAt]) => {
    const [memberId, serviceId] = key.split(':')
    ins.run(uid('at'), memberId, serviceId, markedAt)
  })
})

// ── Inbox seed posts ──────────────────────────────────────────────
run(() => {
  const ins = db.prepare('INSERT INTO inbox_items (id, type, title, body, recipient_id, recipient_role, posted_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
  ins.run(uid('i'), 'event', 'Kibabii CU Missions Week 2026',
    'Join us from 30 June – 4 July for a week of outreach, worship and community. The Media Ministry will cover every session. Arrive 30 minutes early.',
    null, null, '2026-06-19T08:00:00')
  ins.run(uid('i'), 'announcement', 'Equipment check this Thursday',
    'All members serving Sunday must attend Thursday rehearsal for a full equipment check. New mic stands have arrived.',
    null, null, '2026-06-20T14:30:00')
})

console.log('✓ Database seeded successfully.')
console.log('  Members :',  MEMBERS.length)
console.log('  Services:', SERVICES.length)
console.log('  Roles   :', ROLES.length)
