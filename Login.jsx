import { useState } from 'react'

export default function Login() {
  const [message, setMessage] = useState('')

  function handleLogin(event) {
    event.preventDefault()
    // Connect to the login API when it is made.
    setMessage('Login is not connected yet.')
  }

  return (
    <div>
      <h2>Log in</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="login-username">Username </label>
          <input id="login-username" name="username" type="text" autoComplete="username" required />
        </div>
        <div>
          <label htmlFor="login-password">Password </label>
          <input id="login-password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <button type="submit">Log in</button>
      </form>
      <p role="status">{message}</p>
    </div>
  )
}
