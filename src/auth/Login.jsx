import { useState } from 'react'

export default function Login({ onCreateAccount, initialMessage = '' }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(initialMessage)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isError, setIsError] = useState(false)

  const handleLogin = async (event) => {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setMessage('')
    setIsError(false)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json().catch(() => null)

      if (response.ok && data?.success) {
        window.location.assign('/dashboard')
      } else {
        setIsError(true)
        setMessage(response.status >= 500
          ? 'The server is unavailable. Please try again shortly.'
          : data?.message || 'Unable to sign in. Please try again.')
      }
    } catch (error) {
      console.error('Connection error:', error)
      setIsError(true)
      setMessage('Unable to connect to the server. Check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="login-panel" aria-labelledby="login-heading">
      <header className="login-header">
        <h1 id="login-heading">Welcome back.</h1>
      </header>

      <form className="login-form" onSubmit={handleLogin} aria-busy={isSubmitting}>
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
        <button className="login-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
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
        {message && <p className={`login-message${isError ? ' form-error' : ''}`} role={isError ? 'alert' : 'status'}>{message}</p>}
      </form>

      <p className="login-account">
        <button type="button" onClick={onCreateAccount} disabled={isSubmitting}>
          Create an account
        </button>
      </p>
    </section>
  )
}
