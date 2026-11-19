import React from 'react'
import ReactDOM from 'react-dom/client'
import Signup from './auth/Signup'
import Login from './auth/Login'
import Dashboard from './dashboard/Dashboard'
import './styles.css'
import './auth/styles.css'

export default function App() {
  const [page, setPage] = React.useState('login')
  const [loginNotice, setLoginNotice] = React.useState('')
  const dashboardRequested = window.location.pathname.replace(/\/+$/, '') === '/dashboard'
  const [username, setUsername] = React.useState(null)
  const [sessionError, setSessionError] = React.useState('')

  React.useEffect(() => {
    if (!dashboardRequested) return
    const controller = new AbortController()
    async function checkSession() {
      try {
        const response = await fetch('/api/session', { signal: controller.signal })
        if (response.status === 401) {
          window.location.replace('/')
          return
        }
        if (!response.ok) throw new Error()
        const user = await response.json()
        setUsername(user.username)
      } catch {
        if (!controller.signal.aborted) setSessionError('Could not check your session.')
      }
    }
    checkSession()
    return () => controller.abort()
  }, [dashboardRequested])

  async function logout() {
    try {
      const response = await fetch('/api/logout', { method: 'POST' })
      if (!response.ok) throw new Error()
      window.history.replaceState(null, '', '/')
      setUsername(null)
      setPage('login')
      setLoginNotice('You have been logged out.')
    } catch {
      setSessionError('Could not log out. Please try again.')
    }
  }

  if (dashboardRequested) {
    if (!username) return <main className="auth-page">
      {sessionError ? <div role="alert">{sessionError} <button onClick={() => window.location.reload()}>Retry</button></div>
        : <p role="status">Checking your session…</p>}
    </main>
    return <>{sessionError && <p role="alert">{sessionError}</p>}<Dashboard username={username} onLogout={logout} /></>
  }

  return (
    <main className="auth-page">
      {page === 'login' ? (
        <Login
          initialMessage={loginNotice}
          onCreateAccount={() => {
            setLoginNotice('')
            setPage('signup')
          }}
        />
      ) : (
        <section className="signup-panel" aria-label="Create a FairShare account">
          <h1>FairShare</h1>
          <Signup onSuccess={() => {
            setLoginNotice('Account created. Please sign in.')
            setPage('login')
          }} />
          <button className="back-to-login" type="button" onClick={() => setPage('login')}>
            Back to sign in
          </button>
        </section>
      )}
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
