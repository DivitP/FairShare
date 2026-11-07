import { useState } from 'react'

export default function Signup({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json().catch(() => null)

      if (response.ok && data?.success) {
        onSuccess()
      } else {
        setMessage(response.status >= 500
          ? 'The server is unavailable. Please try again shortly.'
          : data?.message || 'Unable to create your account. Please try again.')
      }
    } catch (error) {
      console.error('Connection error:', error)
      setMessage('Unable to connect to the server. Check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h2>Sign Up</h2>
      {message && <p className="form-error" role="alert">{message}</p>}

      <form onSubmit={handleSignup} aria-busy={isSubmitting}>
        <div>
          <label>Username </label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label>Password </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}
