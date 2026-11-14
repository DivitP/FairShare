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
  const [username, setUsername] = React.useState(() => sessionStorage.getItem('fairshare.username'))

  if (window.location.pathname.replace(/\/+$/, '') === '/dashboard') {
    if (username) {
      return <Dashboard username={username} onLogout={() => {
        sessionStorage.removeItem('fairshare.username')
        setUsername(null)
        setPage('login')
        setLoginNotice('You have been logged out.')
        window.history.replaceState(null, '', '/')
      }} />
    }
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
