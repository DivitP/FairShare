const crypto = require('node:crypto')

function createInviteCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 6 }, () => characters[crypto.randomInt(characters.length)]).join('')
}

function normalizeGroupName(value) {
  if (typeof value !== 'string') return null
  const name = value.trim()
  return name.length >= 1 && name.length <= 100 ? name : null
}

async function createGroup(pool, name, userId, generateCode = createInviteCode) {
  const db = await pool.connect()
  try {
    await db.query('BEGIN')
    let group
    for (let attempt = 0; attempt < 5; attempt++) {
      const { rows } = await db.query(
        `INSERT INTO roommate_groups (name, invite_code, created_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (invite_code) DO NOTHING
         RETURNING id, name, invite_code`,
        [name, generateCode(), userId]
      )
      if (rows.length) {
        group = rows[0]
        break
      }
    }
    if (!group) {
      const error = new Error('Unable to allocate an invite code')
      error.code = 'INVITE_CODE_EXHAUSTED'
      throw error
    }
    await db.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [group.id, userId])
    await db.query('COMMIT')
    return group
  } catch (err) {
    await db.query('ROLLBACK')
    throw err
  } finally {
    db.release()
  }
}

module.exports = { normalizeGroupName, createGroup }
