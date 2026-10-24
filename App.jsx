import React from 'react'
import ReactDOM from 'react-dom/client'
import Signup from './Signup'

export default function App() {
  return (
    <div>
      <Signup />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
