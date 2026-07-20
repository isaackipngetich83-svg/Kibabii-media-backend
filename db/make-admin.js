// Usage: node db/make-admin.js REG_NO
// Example: node db/make-admin.js COM/0110/24

const db = require('./database')

const regNo = process.argv[2]

if (!regNo) {
  console.error('\n  Usage: node db/make-admin.js REG_NO')
  console.error('  Example: node db/make-admin.js COM/0110/24\n')
  process.exit(1)
}

const normalised = regNo.trim().toUpperCase()
const member = db.prepare('SELECT id, name, reg_no, is_admin FROM members WHERE UPPER(TRIM(reg_no)) = ?').get(normalised)

if (!member) {
  console.error(`\n  No member found with registration number: ${regNo}`)
  console.error('  Make sure the person has signed up first.\n')
  process.exit(1)
}

if (member.is_admin === 1) {
  console.log(`\n  ${member.name} (${member.reg_no}) is already an admin.\n`)
  process.exit(0)
}

db.prepare('UPDATE members SET is_admin = 1 WHERE id = ?').run(member.id)
console.log(`\n  ✓ Done. ${member.name} (${member.reg_no}) is now an administrator.\n`)
