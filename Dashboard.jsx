import './Dashboard.css'

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar" aria-label="Dashboard sidebar">
        <div className="dashboard-sidebar-placeholder">Workspace</div>
        <a className="dashboard-login-link" href="/">Back to sign in</a>
      </aside>

      <main className="dashboard-main" aria-labelledby="dashboard-heading">
        <header className="dashboard-topbar">
          <span>Overview</span>
          <span className="dashboard-preview-label">Frontend preview</span>
        </header>

        <div className="dashboard-content">
          <h1 id="dashboard-heading">Dashboard</h1>
          <p className="dashboard-description">
            Expenses dashboard cards here.
          </p>
        </div>
      </main>
    </div>
  )
}
