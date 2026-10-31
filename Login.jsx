import { useState } from 'react'

export default function Login({ onCreateAccount }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (event) => {
    event.preventDefault()

    // Connect to backend API for login
    try {
      const response = await fetch('/api/login', {
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
    <section className="login-panel" aria-labelledby="login-heading">
      <header className="login-header">
        <h1 id="login-heading">Welcome back.</h1>
      </header>

      <form className="login-form" onSubmit={handleLogin}>
        <div className="login-field">
          <label htmlFor="login-username">Username</label>
          <input
            id="login-username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Enter your username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="login-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="login-submit" type="submit">
          Sign in
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 12h16m-7-7 7 7-7 7" />
          </svg>
        </button>
        {message && <p className="login-message" role="status">{message}</p>}
      </form>

      <p className="login-account">
        <button type="button" onClick={onCreateAccount}>
          Create an account
        </button>
      </p>
    </section>
  )
}
