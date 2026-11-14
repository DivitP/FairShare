const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto')
const { promisify } = require('node:util')
const derive = promisify(scrypt)
const options = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const key = await derive(password, salt, 32, options)
  return ['scrypt-v1', salt, key.toString('hex')].join(':')
}

async function verifyPassword(password, stored) {
  const match = /^scrypt-v1:([0-9a-f]{32}):([0-9a-f]{64})$/.exec(stored)
  if (!match) return false
  const key = await derive(password, match[1], 32, options)
  return timingSafeEqual(key, Buffer.from(match[2], 'hex'))
}

async function initializeUsers(pool) {
  const db = await pool.connect()
  try {
    await db.query('BEGIN')
    await db.query('SELECT pg_advisory_xact_lock(731204)')
    await db.query('CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username TEXT UNIQUE, password_hash TEXT NOT NULL)')
    const legacy = await db.query(`SELECT 1 FROM pg_attribute
      WHERE attrelid = 'users'::regclass AND attname = 'password' AND NOT attisdropped`)
    if (legacy.rowCount) {
      await db.query('LOCK TABLE users IN ACCESS EXCLUSIVE MODE')
      await db.query('ALTER TABLE users ADD COLUMN password_hash TEXT')
      const { rows } = await db.query('SELECT id, password FROM users')
      for (const { id, password } of rows) {
        // Legacy NULL passwords could never authenticate. Keep those accounts locked.
        const hash = await hashPassword(password ?? randomBytes(32).toString('hex'))
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, id])
      }
      await db.query('ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL, DROP COLUMN password')
    }
    await db.query('COMMIT')
  } catch (err) {
    await db.query('ROLLBACK')
    throw err
  } finally {
    db.release()
  }
}

module.exports = { hashPassword, verifyPassword, initializeUsers }
