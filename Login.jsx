import { useState } from 'react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (event) => {
    event.preventDefault()

    
// Connect to backend API for login
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()
      setMessage(data.message)

      if (response.ok) {
        console.log('Logged in user:', data.username)
      }
    } catch (error) {
      console.error('Connection error:', error)
      setMessage('Failed to connect to the server.')
    }
  }

  return (
    <div>
      <h2>Log in</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="login-username">Username </label>
          <input 
            id="login-username" 
            name="username" 
            type="text" 
            autoComplete="username" 
            required 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="login-password">Password </label>
         <input 
            id="login-password" 
            name="password" 
            type="password" 
            autoComplete="current-password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Log in</button>
      </form>
      <p role="status">{message}</p>
    </div>
  )
}
