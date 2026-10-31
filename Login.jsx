import { useState } from 'react'

export default function Login({ onCreateAccount }) {
  const [message, setMessage] = useState('')

  function handleLogin(event) {
    event.preventDefault()
    // Connect to the login API when it is made.
    setMessage('Login is not connected yet.')
  }

  return (
    <section className="login-panel" aria-labelledby="login-heading">
      <header className="login-header">
        <h1 id="login-heading">Welcome back.</h1>
      </header>

      <form className="login-form" onSubmit={handleLogin}>
        <div className="login-field">
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
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
