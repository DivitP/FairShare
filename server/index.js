const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const crypto = require('crypto');

const app = express()
app.use(cors())
app.use(express.json())

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/fairshare'
})



async function initDB(){
await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
  )
`).catch(err => console.error('DB error:', err.message))

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
}
initDB().catch(console.error);

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
  const { username, password } = req.body

  try {
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, password])
    res.json({ success: true, message: 'Account created successfully!' })
  } catch (err) {
    res.status(400).json({ success: false, message: 'Username already taken' })
  }
})

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    )

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid username or password' })
    }

    res.json({ success: true, message: 'Logged in successfully!', username: rows[0].username })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database error' })
  }
})

app.get('/api/expenses', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM expenses ORDER BY id DESC')
  res.json({ expenses: rows })
})

app.post('/api/expenses', async (req, res) => {
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

app.post('/api/groups', async (req, res) => {
 const {name, username} = req.body

  try {
    const {rows} = await pool.query(
      `INSERT INTO roommate_groups (name, invite_code, created_by)
       SELECT $1, $2, id FROM users WHERE username = $3
       RETURNING id, name, invite_code, created_by`,
      [name, createInviteCode(), username]
    )
    const group = rows[0];
    if (!group) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
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



app.delete('/api/expenses/:id', async (req, res) => {
  await pool.query('DELETE FROM expenses WHERE id = $1', [req.params.id])
  res.json({ success: true })
})

const PORT = process.env.PORT || 5001
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
