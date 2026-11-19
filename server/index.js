const { normalizeGroupName, createGroup } = require('./groups')
const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')

const { hashPassword, verifyPassword, initializeUsers } = require('./passwords')

const { initializeSessions, issueSession, registerSessionRoutes, requireSession } = require('./sessions')

const app = express()
app.use(cors())
app.use(express.json())

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/fairshare'
})

registerSessionRoutes(app, pool)

app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body || {}

  if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password.length) {
    return res.status(400).json({ success: false, message: 'Username and password are required' })
  }

  try {
    const hash = await hashPassword(password)
    await pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [username, hash])
    res.json({ success: true, message: 'Account created successfully!' })
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, message: 'Username already taken' })
    res.status(500).json({ success: false, message: 'Could not create account' })
  }
})

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {}

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid username or password' })
  }
  try {
    const { rows } = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username]
    )

    if (!rows.length || !(await verifyPassword(password, rows[0].password_hash))) {
      return res.status(400).json({ success: false, message: 'Invalid username or password' })
    }

    await issueSession(pool, req, res, rows[0].id)
    res.json({ success: true, message: 'Logged in successfully!', username: rows[0].username })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database error' })
  }
})

async function requireGroup(req, res, next) {
  const id = Number(req.query.groupId || req.body?.groupId)
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ message: 'Select a valid group.' })
  const member = await pool.query('SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2', [id, req.user.id])
  if (!member.rowCount) return res.status(404).json({ message: 'Group not found.' })
  req.groupId = id
  next()
}

app.get('/api/expenses', requireSession(pool), requireGroup, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM expenses WHERE group_id=$1 ORDER BY id DESC', [req.groupId])
  res.json({ expenses: rows })
})

app.post('/api/expenses', requireSession(pool), requireGroup, async (req, res) => {
  const { description, amount, category, payer } = req.body || {}
  const cents = Math.round(Number(amount) * 100)
  if (![description, category, payer].every(v => typeof v === 'string' && v.trim())
      || !Number.isSafeInteger(cents) || cents <= 0 || cents > 2147483647) {
    return res.status(400).json({ message: 'Invalid or missing expense details.' })
  }
  const { rows } = await pool.query(
    'INSERT INTO expenses (description, amount, category, payer, group_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [description.trim(), cents, category.trim(), payer.trim(), req.groupId])
  res.json({ success: true, expense: rows[0] })
})

app.post('/api/groups/join', requireSession(pool), async (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : ''
  if (!/^[A-Z0-9]{6}$/.test(code)) return res.status(400).json({ message: 'Enter a six-character invite code.' })
  const { rows } = await pool.query('SELECT id,name,invite_code FROM roommate_groups WHERE invite_code=$1', [code])
  if (!rows.length) return res.status(404).json({ message: 'Invite code not found.' })
  await pool.query('INSERT INTO group_members (group_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [rows[0].id, req.user.id])
  res.json({ success: true, group: rows[0] })
})

app.get('/api/groups', requireSession(pool), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT g.id, g.name, g.invite_code FROM roommate_groups g
       JOIN group_members m ON m.group_id = g.id
       WHERE m.user_id = $1 ORDER BY g.id DESC`, [req.user.id])
    res.json({ groups: rows })
  } catch {
    res.status(500).json({ success: false, message: 'Could not load your groups.' })
  }
})

app.post('/api/groups', requireSession(pool), async (req, res) => {
  const name = normalizeGroupName(req.body?.name)
  if (!name) {
    return res.status(400).json({ success: false, message: 'Group name must be between 1 and 100 characters.' })
  }

  try {
    const group = await createGroup(pool, name, req.user.id)
    res.json({ success: true, group })
  } catch (err) {
    if (err.code === 'INVITE_CODE_EXHAUSTED') {
      return res.status(503).json({ success: false, message: 'Could not generate an invite code. Please try again.' })
    }
    res.status(500).json({ success: false, message: 'Could not create group. Please try again.' })
  }
})

app.delete('/api/expenses/:id', requireSession(pool), requireGroup, async (req, res) => {
  if (!/^[1-9][0-9]*$/.test(req.params.id)) return res.status(400).json({ message: 'Invalid expense ID.' })
  const result = await pool.query('DELETE FROM expenses WHERE id=$1 AND group_id=$2', [req.params.id, req.groupId])
  if (!result.rowCount) return res.status(404).json({ message: 'Expense not found.' })
  res.json({ success: true })
})

app.use((err, req, res, next) => {
  res.status(500).json({ message: 'Server error. Please try again.' })
})

const PORT = process.env.PORT || 5001
async function start() {
  await initializeUsers(pool)
  await initializeSessions(pool)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      description TEXT,
      amount INTEGER,
      category TEXT,
      payer TEXT
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roommate_groups (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_by INTEGER REFERENCES users(id))`)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS group_members (
    group_id INTEGER REFERENCES roommate_groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, user_id))`)

  await pool.query('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES roommate_groups(id)')
  await pool.query('CREATE INDEX IF NOT EXISTS expenses_group_id_idx ON expenses(group_id)')
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
}

start().catch(async err => {
  console.error('Database initialization failed:', err.code || err.name)
  await pool.end()
  process.exitCode = 1
})
