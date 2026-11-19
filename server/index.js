const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
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

function createInviteCode(){
  const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const codelength = 6;
  let code = '';
  for (let i = 0; i < codelength; i++)
  {
    const index = crypto.randomInt(possibleChars.length)
    code += possibleChars[index]
  }
  return code;
}

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

app.get('/api/expenses', requireSession(pool), async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM expenses ORDER BY id DESC')
  res.json({ expenses: rows })
})

app.post('/api/expenses', requireSession(pool), async (req, res) => {
  const { description, amount, category, payer } = req.body
  const cents = Math.round(Number(amount) * 100)
  if (!description || !category || !payer || isNaN(cents) || cents <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid or missing expense details' })
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO expenses (description, amount, category, payer) VALUES ($1, $2, $3, $4) RETURNING *',
      [description.trim(), cents, category, payer.trim()]
    )
    res.json({ success: true, expense: rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database error' })
  }
})

app.post('/api/groups', requireSession(pool), async (req, res) => {
  const { name } = req.body || {}

  try {
    const {rows} = await pool.query(
      `INSERT INTO roommate_groups (name, invite_code, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, name, invite_code, created_by`,
      [name, createInviteCode(), req.user.id]
    )
    const group = rows[0];
    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [group.id, group.created_by]
    )

    res.json({
      success: true,
      group: { id: group.id, name: group.name, invite_code: group.invite_code }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database error' })
  }
}
)



app.delete('/api/expenses/:id', requireSession(pool), async (req, res) => {
  await pool.query('DELETE FROM expenses WHERE id = $1', [req.params.id])
  res.json({ success: true })
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

  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
}

start().catch(async err => {
  console.error('Database initialization failed:', err.code || err.name)
  await pool.end()
  process.exitCode = 1
})
