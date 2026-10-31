import './Dashboard.css'

const navigationItems = [
  { label: 'Overview', icon: 'overview' },
  { label: 'Expenses', icon: 'expenses' },
  { label: 'Balances', icon: 'balances' },
  { label: 'Upcoming', icon: 'upcoming' },
  { label: 'Insights', icon: 'insights' },
  { label: 'Activity', icon: 'activity' },
]

function SidebarIcon({ name }) {
  const paths = {
    overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    expenses: 'M5 3h14v18l-3-2-4 2-4-2-3 2z M8 7h8 M8 11h8 M8 15h4',
    balances: 'M3 6h16v14H3z M3 6V3h13v3 M15 11h6v5h-6z',
    upcoming: 'M4 5h16v16H4z M8 2v6 M16 2v6 M4 11h16',
    insights: 'M4 20V10 M10 20V4 M16 20v-7 M22 20V7',
    activity: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 7 M22 21v-2a4 4 0 0 0-3-4',
    home: 'M3 10l9-7 9 7v11H3z M9 21v-8h6v8',
  }

  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={paths[name]} />
    </svg>
  )
}

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar" aria-label="Dashboard sidebar">
        <div className="dashboard-brand" aria-label="FairShare">
          <svg className="dashboard-brand-mark" width="28" height="34" viewBox="0 0 28 34"
            fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M2 4 27 2 21 10 3 11z M3 15 19 14 13 22 4 23z M4 27 11 26 5 33z" />
          </svg>
          <span>fairshare<span className="dashboard-brand-dot">.</span></span>
        </div>

        <section className="dashboard-workspace" aria-labelledby="workspace-label">
          <h2 className="dashboard-section-label" id="workspace-label">Your workspace</h2>
          <div className="dashboard-household">
            <span className="dashboard-household-icon"><SidebarIcon name="home" /></span>
            <div className="dashboard-household-copy">
              <strong title="Dorm 777">Dorm 777</strong>
              <span>3 roommates · USD</span>
            </div>
          </div>
        </section>

        <nav className="dashboard-navigation" aria-label="Dashboard navigation">
          {navigationItems.map(({ label, icon }) => (
            label === 'Overview' ? (
              <a className="dashboard-nav-item dashboard-nav-active" href="/dashboard"
                aria-current="page" key={label}>
                <SidebarIcon name={icon} /><span>{label}</span>
              </a>
            ) : (
              <button className="dashboard-nav-item" type="button" key={label}
                disabled aria-describedby="dashboard-navigation-note">
                <SidebarIcon name={icon} /><span>{label}</span>
                <span className="dashboard-soon">Soon</span>
              </button>
            )
          ))}
          <p className="dashboard-navigation-note" id="dashboard-navigation-note">
            More pages coming soon.
          </p>
        </nav>

        <section className="dashboard-groups" aria-labelledby="groups-label">
          <div className="dashboard-groups-heading">
            <h2 className="dashboard-section-label" id="groups-label">Your groups</h2>
            <button className="dashboard-add-group" type="button" disabled
              aria-label="Add group (coming soon)" title="Add group — coming soon">+</button>
          </div>
          <div className="dashboard-group-entry">
            <span className="dashboard-group-dot" aria-hidden="true" />
            <span>Dorm 777</span>
            <span className="dashboard-sample-label">Sample</span>
          </div>
        </section>
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
