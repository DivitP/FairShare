import React from 'react'
import ReactDOM from 'react-dom/client'
import Signup from './Signup'
import Login from './Login'
import './styles.css'

export default function App() {
  const [page, setPage] = React.useState('login')

  return (
    <main>
      <h1>FairShare</h1>
      {page === 'login' ? <Login /> : <Signup />}
      <p>
        <button type="button" onClick={() => setPage(page === 'login' ? 'signup' : 'login')}>
          {page === 'login' ? 'Create an account' : 'Back to login'}
        </button>
      </p>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
