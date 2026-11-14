import { useState, useEffect } from 'react'
import './Dashboard.css'
import DashboardIcon from './DashboardIcon'
import SummaryCard from './SummaryCard'
import { formatUSD } from './dashboardPreviewData'

const navigationItems = [
  { label: 'Overview', icon: 'overview' },
  { label: 'Expenses', icon: 'expenses' },
  { label: 'Balances', icon: 'balances' },
  { label: 'Upcoming', icon: 'upcoming' },
  { label: 'Insights', icon: 'insights' },
  { label: 'Activity', icon: 'activity' },
]

export default function Dashboard({ username, onLogout }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: 'Groceries', payer: '' })
  const [error, setError] = useState('')
  const [expenses, setExpenses] = useState([])

  useEffect(() => {
    fetch('/api/expenses')
      .then(res => res.ok ? res.json() : null)
      .then(data => data?.expenses && setExpenses(data.expenses.map(e => ({
        ...e,
        total: e.amount,
        icon: (e.category || 'household').toLowerCase(),
        dateLabel: 'Today',
        direction: 'lent',
        userAmount: e.amount
      }))))
      .catch(() => {})
  }, [])

  const totalCents = expenses.reduce((sum, e) => sum + (e.total || 0), 0)

  const handleAddExpense = async (e) => {
    e.preventDefault()
    const cents = Math.round(Number(form.amount) * 100)
    if (!form.description || !form.payer || !form.category || isNaN(cents) || cents <= 0) {
      return setError('Please fill in all fields with a valid amount.')
    }
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (!res.ok) return setError(data.message || 'Error saving expense')
    const item = {
      id: `exp-${Date.now()}`,
      description: form.description,
      payer: form.payer,
      total: cents,
      category: form.category,
      icon: form.category.toLowerCase(),
      dateLabel: 'Today',
      direction: form.payer.toLowerCase() === 'you' ? 'lent' : 'borrowed',
      userAmount: Math.round(cents / 3)
    }
    setExpenses([item, ...expenses])
    setShowAdd(false)
    setForm({ description: '', amount: '', category: 'Groceries', payer: '' })
    setError('')
  }

  const handleDeleteExpense = async (id) => {
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    setExpenses(expenses.filter(e => e.id !== id))
  }
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
              <h1 id="dashboard-heading">{username ? `${username}, welcome.` : 'Welcome.'}</h1>
            </div>
            <div className="dashboard-actions">
              <button className="dashboard-action" type="button" disabled aria-describedby="dashboard-actions-note">
                <DashboardIcon name="balances" />Settle up
              </button>
              <button className="dashboard-action dashboard-action-primary" type="button" onClick={() => setShowAdd(true)}>
                <DashboardIcon name="plus" />Add expense
              </button>
              <span className="dashboard-actions-note" id="dashboard-actions-note">Settle up coming soon.</span>
            </div>
          </section>

          <section className="dashboard-summary-grid" aria-label="Balance summaries">
            <SummaryCard label="Your total balance" amount={totalCents}
              description="" icon="balances" variant="navy" />
            <SummaryCard label="You are owed" amount={totalCents}
              description="" icon="up" variant="blue" />
            <SummaryCard label="You owe" amount={0}
              description="" icon="arrow" />
          </section>

          <section className="dashboard-expenses" aria-labelledby="recent-expenses-heading">
            <div className="dashboard-expenses-header">
              <h2 id="recent-expenses-heading">Recent expenses <span className="dashboard-expense-count">{expenses.length}</span></h2>
              <button className="dashboard-view-all" type="button" disabled aria-label="View all expenses (coming soon)">
                View all<DashboardIcon name="arrow" /><span className="dashboard-soon">Soon</span>
              </button>
            </div>
            <ul className="dashboard-expense-list">
              {expenses.map(expense => (
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
                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(expense.id)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px 8px', fontSize: '15px' }}
                    title="Delete expense"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>Add Expense</h3>
            {error && <p className="modal-error">{error}</p>}
            <form onSubmit={handleAddExpense}>
              <input placeholder="Description" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <input type="number" step="0.01" min="0.01" placeholder="Amount ($)" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="Groceries">Groceries</option>
                <option value="Utilities">Utilities</option>
                <option value="Dining">Dining</option>
                <option value="Household">Household</option>
              </select>
              <input placeholder="Payer (e.g. You)" required value={form.payer} onChange={e => setForm({ ...form, payer: e.target.value })} />
              <div className="modal-actions">
                <button className="dashboard-action" type="button" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="dashboard-action dashboard-action-primary" type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
