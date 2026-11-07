import './Dashboard.css'
import DashboardIcon from './DashboardIcon'
import SummaryCard from './SummaryCard'
import { dashboardPreview, formatUSD } from './dashboardPreviewData'

const navigationItems = [
  { label: 'Overview', icon: 'overview' },
  { label: 'Expenses', icon: 'expenses' },
  { label: 'Balances', icon: 'balances' },
  { label: 'Upcoming', icon: 'upcoming' },
  { label: 'Insights', icon: 'insights' },
  { label: 'Activity', icon: 'activity' },
]

export default function Dashboard({ username, onLogout }) {
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
            <span className="dashboard-household-icon"><DashboardIcon name="home" /></span>
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
                <DashboardIcon name={icon} /><span>{label}</span>
              </a>
            ) : (
              <button className="dashboard-nav-item" type="button" key={label}
                disabled aria-describedby="dashboard-navigation-note">
                <DashboardIcon name={icon} /><span>{label}</span>
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
        <button className="dashboard-login-link" type="button" onClick={onLogout}>Log out</button>
      </aside>

      <main className="dashboard-main" aria-labelledby="dashboard-heading">
        <header className="dashboard-topbar">
          <nav className="dashboard-breadcrumb" aria-label="Breadcrumb">
            <span>Dorm 777</span>
            <DashboardIcon name="chevron" />
            <span aria-current="page">Overview</span>
          </nav>
          <span className="dashboard-preview-label"><span className="dashboard-status-dot" aria-hidden="true" />{username}</span>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome" aria-labelledby="dashboard-heading">
            <div>
              <p className="dashboard-eyebrow">Split fairly</p>
              <h1 id="dashboard-heading">Hey {username}, welcome home.</h1>
              <p className="dashboard-description">Here’s where things stand with your group.</p>
            </div>
            <div className="dashboard-actions">
              <button className="dashboard-action" type="button" disabled aria-describedby="dashboard-actions-note">
                <DashboardIcon name="balances" />Settle up
              </button>
              <button className="dashboard-action dashboard-action-primary" type="button" disabled aria-describedby="dashboard-actions-note">
                <DashboardIcon name="plus" />Add expense
              </button>
              <span className="dashboard-actions-note" id="dashboard-actions-note">Expense and payment actions coming soon.</span>
            </div>
          </section>

          <section className="dashboard-summary-grid" aria-label="Balance summaries">
            <SummaryCard label="Your total balance" amount={dashboardPreview.balance}
              description="You’re owed overall" icon="balances" variant="navy" />
            <SummaryCard label="You are owed" amount={dashboardPreview.owed}
              description="A little something coming back" icon="up" variant="blue" />
            <SummaryCard label="You owe" amount={dashboardPreview.owing}
              description="You’re all settled up" icon="arrow" />
            <SummaryCard label="Your total share" amount={dashboardPreview.totalShare}
              description="Across all household expenses" icon="insights" />
          </section>

          <section className="dashboard-expenses" aria-labelledby="recent-expenses-heading">
            <div className="dashboard-expenses-header">
              <h2 id="recent-expenses-heading">Recent expenses <span className="dashboard-expense-count">{dashboardPreview.expenses.length}</span></h2>
              <button className="dashboard-view-all" type="button" disabled aria-label="View all expenses (coming soon)">
                View all<DashboardIcon name="arrow" /><span className="dashboard-soon">Soon</span>
              </button>
            </div>
            <ul className="dashboard-expense-list">
              {dashboardPreview.expenses.map(expense => (
                <li className="dashboard-expense-row" key={expense.id}>
                  <span className={`dashboard-category-icon dashboard-category-${expense.icon}`}><DashboardIcon name={expense.icon} /></span>
                  <div className="dashboard-expense-copy">
                    <h3>{expense.description}</h3>
                    <p>{expense.payer} paid {formatUSD(expense.total)} <span aria-hidden="true">·</span> {expense.category}</p>
                  </div>
                  <span className="dashboard-expense-date">{expense.dateLabel}</span>
                  <div className={`dashboard-expense-share${expense.direction === 'lent' ? ' dashboard-share-lent' : ''}`}>
                    <span>you {expense.direction}</span>
                    <strong>{formatUSD(expense.userAmount)}</strong>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}
