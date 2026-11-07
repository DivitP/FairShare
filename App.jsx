import React from 'react'
import ReactDOM from 'react-dom/client'
import Signup from './Signup'
import Login from './Login'
import Dashboard from './Dashboard'
import './styles.css'

export default function App() {
  const [page, setPage] = React.useState('login')

  if (window.location.pathname.replace(/\/+$/, '') === '/dashboard') {
    return <Dashboard />
  }

  return (
    <main className="auth-page">
      {page === 'login' ? (
        <Login onCreateAccount={() => setPage('signup')} />
      ) : (
        <section className="signup-panel" aria-label="Create a FairShare account">
          <h1>FairShare</h1>
          <Signup />
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
