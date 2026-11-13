const { createHash, randomBytes } = require('node:crypto')

const cookieName = 'fairshare_session'
const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' }
const digest = token => createHash('sha256').update(token).digest('hex')

function sessionKey(req) {
  const token = (req.headers.cookie || '').match(/(?:^|;\s*)fairshare_session=([a-f0-9]{64})(?:;|$)/)
  return token ? digest(token[1]) : null
}

async function initializeSessions(pool) {
  await pool.query(`CREATE TABLE IF NOT EXISTS login_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
  )`)
}

async function issueSession(pool, req, res, userId) {
  const token = randomBytes(32).toString('hex')
  await pool.query('DELETE FROM login_sessions WHERE expires_at <= now() OR token_hash = $1', [sessionKey(req)])
  await pool.query(`INSERT INTO login_sessions VALUES ($1, $2, now() + interval '1 day')`, [digest(token), userId])
  res.cookie(cookieName, token, { ...cookieOptions, maxAge: 86400000 })
}

function registerSessionRoutes(app, pool) {
  app.get('/api/session', async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const key = sessionKey(req)
    const user = key && (await pool.query(`SELECT username FROM users
      JOIN login_sessions ON users.id = login_sessions.user_id
      WHERE token_hash = $1 AND expires_at > now()`, [key])).rows[0]
    if (!user) return res.status(401).json({ success: false })
    res.json({ username: user.username })
  })

  app.post('/api/logout', async (req, res) => {
    await pool.query('DELETE FROM login_sessions WHERE token_hash = $1', [sessionKey(req)])
    res.clearCookie(cookieName, cookieOptions).sendStatus(204)
  })
}

module.exports = { initializeSessions, issueSession, registerSessionRoutes }
