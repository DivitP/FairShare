const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

const users = []

app.post('/api/signup', (req, res) => {
  const { username, password } = req.body


  const userExists = users.find((u) => u.username === username)
  if (userExists) {
    return res.status(400).json({ success: false, message: 'Username already taken' })
  }

  users.push({ username, password })
  console.log('Current users:', users)

  res.json({ success: true, message: 'Account created successfully!' })
})

app.listen(5000, () => console.log('Server is running on port 5000'))
