const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')

const app = express()
app.use(cors())
app.use(express.json())

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/fairshare'
})

pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
  )
`)

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

  const { rows } = await pool.query(
    'SELECT * FROM users WHERE username = $1 AND password = $2',
    [username, password]
  )

  if (rows.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid username or password' })
  }

  res.json({ success: true, message: 'Logged in successfully!', username: rows[0].username })
})

const PORT = process.env.PORT || 5001
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
