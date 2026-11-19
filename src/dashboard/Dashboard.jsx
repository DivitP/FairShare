import { useState, useEffect, useRef } from 'react'
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

function todayLocal() {
  const date = new Date()
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export default function Dashboard({ username, onLogout }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: 'Groceries', payer: '', expenseDate: todayLocal() })
  const [error, setError] = useState('')
  const [expenses, setExpenses] = useState([])
  const [groups, setGroups] = useState([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [groupsError, setGroupsError] = useState('')
  const [groupsReload, setGroupsReload] = useState(0)
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const selectionKey = 'fairshare.selectedGroup.' + username

  function selectGroup(id) {
    setSelectedGroupId(id)
    try { sessionStorage.setItem(selectionKey, String(id)) } catch {}
  }

  useEffect(() => {
    const controller = new AbortController()
    setGroupsLoading(true)
    setGroupsError('')
    async function loadGroups() {
      try {
        const response = await fetch('/api/groups', { signal: controller.signal })
        if (!response.ok) throw new Error(response.status === 401
          ? 'Please sign in again to load your groups.' : 'Could not load your groups.')
        const data = await response.json()
        if (!Array.isArray(data.groups)) throw new Error('Could not load your groups.')
        if (controller.signal.aborted) return
        setGroups(data.groups)
        let saved
        try { saved = sessionStorage.getItem(selectionKey) } catch {}
        setSelectedGroupId(current => data.groups.find(g => g.id === current)?.id
          ?? data.groups.find(g => String(g.id) === saved)?.id ?? data.groups[0]?.id ?? null)
      } catch (err) {
        if (!controller.signal.aborted) setGroupsError(err.message)
      } finally {
        if (!controller.signal.aborted) setGroupsLoading(false)
      }
    }
    loadGroups()
    return () => controller.abort()
  }, [selectionKey, groupsReload])

  const selectedGroup = groups.find(group => group.id === selectedGroupId)
  const workspaceName = selectedGroup?.name
    || (groupsLoading ? 'Loading groups…' : groupsError ? 'Groups unavailable' : 'No group selected')

  const [showGroupOptions, setShowGroupOptions] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupNotice, setGroupNotice] = useState('')

  const [savingGroup, setSavingGroup] = useState(false)
  const [createdGroup, setCreatedGroup] = useState(null)
  const [copyNotice, setCopyNotice] = useState('')
  const groupRequestPending = useRef(false)
  const groupSuccessHeading = useRef(null)

  useEffect(() => {
    if (createdGroup) groupSuccessHeading.current?.focus()
  }, [createdGroup])

  async function submitGroup(event) {
    event.preventDefault()
    if (groupRequestPending.current || createdGroup) return
    const name = groupName.trim()
    if (!name || name.length > 100) {
      setGroupNotice('Group name must be between 1 and 100 characters.')
      return
    }
    groupRequestPending.current = true
    setSavingGroup(true)
    setGroupNotice('')
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setGroupNotice(response.status === 401
          ? 'Your session has expired. Please sign in again.'
          : data?.message || 'Could not create group. Please try again.')
        return
      }
      if (!data?.success || !data.group?.name || !data.group?.invite_code) {
        setGroupNotice('The server returned an unexpected response. The group may have been created.')
        return
      }
      setCreatedGroup(data.group)
      setGroups(current => [data.group, ...current.filter(group => group.id !== data.group.id)])
      selectGroup(data.group.id)
      setGroupsReload(current => current + 1)
    } catch {
      setGroupNotice('Could not confirm whether the group was saved. Check your connection before trying again.')
    } finally {
      groupRequestPending.current = false
      setSavingGroup(false)
    }
  }

  async function copyInviteCode() {
    try {
      await navigator.clipboard.writeText(createdGroup.invite_code)
      setCopyNotice('Code copied.')
    } catch {
      setCopyNotice('Could not copy automatically. Select and copy the code above.')
    }
  }

  function closeCreateGroup() {
    if (groupRequestPending.current) return
    setCreatedGroup(null)
    setCopyNotice('')
    setShowCreateGroup(false)
    setGroupName('')
    setGroupNotice('')
  }

  const [expenseReload, setExpenseReload] = useState(0)
  const [expenseLoading, setExpenseLoading] = useState(false)
  const [savingExpense, setSavingExpense] = useState(false)
  const expensePending = useRef(false)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const joinPending = useRef(false)

  async function joinGroup(event) {
    event.preventDefault()
    if (joinPending.current) return
    joinPending.current = true
    setJoining(true)
    setJoinError('')
    try {
      const res = await fetch('/api/groups/join', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({code:joinCode}) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Could not join group.')
      setGroups(current => [data.group, ...current.filter(g => g.id !== data.group.id)])
      selectGroup(data.group.id)
      setGroupsReload(n => n + 1)
      setShowGroupOptions(false)
      setJoinCode('')
    } catch (err) { setJoinError(err.message) }
    finally { joinPending.current = false; setJoining(false) }
  }

  useEffect(() => {
    const controller = new AbortController()
    setExpenses([])
    setError('')
    setShowAdd(false)
    if (!selectedGroupId) { setExpenseLoading(false); return }
    setExpenseLoading(true)
    fetch('/api/expenses?groupId=' + selectedGroupId, {signal:controller.signal})
      .then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.message); return data })
      .then(data => { if (!controller.signal.aborted) setExpenses(data.expenses.map(expenseView)) })
      .catch(err => { if (!controller.signal.aborted) setError(err.message || 'Could not load expenses.') })
      .finally(() => { if (!controller.signal.aborted) setExpenseLoading(false) })
    return () => controller.abort()
  }, [selectedGroupId, expenseReload])

  function expenseView(e) {
    return {...e,total:e.amount,icon:e.category.toLowerCase(),dateLabel:e.expense_date || 'Date unknown',direction:'expense total',userAmount:e.amount}
  }
  const totalCents = expenses.reduce((sum, e) => sum + (e.total || 0), 0)

  const handleAddExpense = async event => {
    event.preventDefault()
    if (expensePending.current || !selectedGroupId) return
    expensePending.current = true
    setSavingExpense(true)
    setError('')
    try {
      const res = await fetch('/api/expenses', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,groupId:selectedGroupId})})
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Could not save expense.')
      setExpenseReload(n => n + 1)
      setShowAdd(false)
      setForm({description:'',amount:'',category:'Groceries',payer:'',expenseDate:todayLocal()})
    } catch(err) { setError(err.message) }
    finally { expensePending.current = false; setSavingExpense(false) }
  }
  const handleDeleteExpense = async id => {
    try {
      const res = await fetch('/api/expenses/'+id+'?groupId='+selectedGroupId,{method:'DELETE'})
      if (!res.ok) throw new Error('Could not delete expense.')
      setExpenseReload(n => n + 1)
    } catch(err) { setError(err.message) }
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
              <strong title={workspaceName}>{workspaceName}</strong>
              <span>{selectedGroup ? "Selected group · USD" : "Your workspace"}</span>
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
            <button className="dashboard-add-group" type="button" aria-label="Add Group" aria-expanded={showGroupOptions || showCreateGroup}
            onClick={() => setShowGroupOptions(true)} style={{ cursor: 'pointer' }}>
              +</button>
          </div>
          {groupsLoading && <p role="status">Loading groups…</p>}
          {groupsError && <div role="alert"><p>{groupsError}</p>
            <button type="button" onClick={() => setGroupsReload(current => current + 1)}>Retry</button>
          </div>}
          {!groupsLoading && !groupsError && groups.length === 0 && <p>No groups yet. Create one using +.</p>}
          {groups.map(group => (
            <button key={group.id} type="button" className="dashboard-group-entry dashboard-group-select"
              aria-pressed={selectedGroupId === group.id} onClick={() => selectGroup(group.id)}>
              <span className="dashboard-group-dot" aria-hidden="true" />
              <span>{group.name}</span>
            </button>
          ))}
        </section>
        <button className="dashboard-login-link" type="button" onClick={onLogout}>Log out</button>
      </aside>

      <main className="dashboard-main" aria-labelledby="dashboard-heading">
        <header className="dashboard-topbar">
          <nav className="dashboard-breadcrumb" aria-label="Breadcrumb">
            <span>{workspaceName}</span>
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
              <button className="dashboard-action dashboard-action-primary" type="button" disabled={!selectedGroupId || savingExpense} onClick={() => setShowAdd(true)}>
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
            {error && <p role="alert">{error} <button onClick={() => setExpenseReload(n => n + 1)}>Retry</button></p>}
            {expenseLoading && <p role="status">Loading expenses…</p>}
            {!expenseLoading && !error && !expenses.length && <p>{selectedGroupId ? 'No expenses in this group yet.' : 'Create or join a group to add expenses.'}</p>}
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
                    <span>Expense total</span>
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
              <label htmlFor="expense-date">Expense date</label>
              <input id="expense-date" type="date" required min="0001-01-01" max="9999-12-31"
                value={form.expenseDate} onChange={e => setForm({ ...form, expenseDate: e.target.value })} />
              <input placeholder="Description"  required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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
                <button className="dashboard-action dashboard-action-primary" type="submit" disabled={savingExpense}>{savingExpense ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showGroupOptions && (
        <dialog className="modal-content group-dialog" aria-labelledby="group-options-title"
          ref={node => { if (node && !node.open) node.showModal() }}
          onCancel={() => setShowGroupOptions(false)}>
          <h2 id="group-options-title">Add a group</h2>
          <form onSubmit={joinGroup}>
            <label htmlFor="join-code">Invite code</label>
            <input id="join-code" value={joinCode} maxLength={6} required disabled={joining}
              onChange={event => setJoinCode(event.target.value)} />
            {joinError && <p role="alert">{joinError}</p>}
            <button className="dashboard-action" disabled={joining || !/^[A-Z0-9]{6}$/i.test(joinCode.trim())}>
              {joining ? 'Joining…' : 'Join group'}
            </button>
          </form>
          <div className="modal-actions">
            <button className="dashboard-action dashboard-action-primary" type="button"
              onClick={() => {
                setShowGroupOptions(false)
                setShowCreateGroup(true)
              }}>
              Create group
            </button>
          </div>
          <button className="dashboard-action" type="button" onClick={() => setShowGroupOptions(false)}>Cancel</button>
        </dialog>
      )}
      {showCreateGroup && (
        <dialog className="modal-content group-dialog" aria-labelledby="create-group-title"
          ref={node => { if (node && !node.open) node.showModal() }}
          onCancel={event => {
            if (groupRequestPending.current) event.preventDefault()
            else closeCreateGroup()
          }}>
          {createdGroup ? (
            <>
              <h2 id="create-group-title" tabIndex={-1} ref={groupSuccessHeading}>Group created</h2>
              <p><strong>{createdGroup.name}</strong></p>
              <p>Invite code: <code>{createdGroup.invite_code}</code></p>
              <p>Share this code with your roommates so they can join.</p>
              {copyNotice && <p role="status">{copyNotice}</p>}
              <div className="modal-actions">
                <button className="dashboard-action" type="button" onClick={copyInviteCode}>Copy code</button>
                <button className="dashboard-action dashboard-action-primary" type="button" onClick={closeCreateGroup}>Done</button>
              </div>
            </>
          ) : (
          <>
          <h2 id="create-group-title">Create a group</h2>
          <form onSubmit={submitGroup} aria-busy={savingGroup}>
            <label htmlFor="group-name">Group name</label>
            <input id="group-name" name="groupName" placeholder="e.g. Dorm 777"
              required maxLength={100} autoFocus value={groupName} disabled={savingGroup}
              aria-describedby="group-name-help"
              onChange={event => {
                setGroupName(event.target.value)
                setGroupNotice('')
              }} />
            <p id="group-name-help">Choose a name between 1 and 100 characters.</p>
            {groupNotice && <p role="alert" className="modal-error">{groupNotice}</p>}
            <div className="modal-actions">
              <button className="dashboard-action" type="button" disabled={savingGroup} onClick={closeCreateGroup}>Cancel</button>
              <button className="dashboard-action dashboard-action-primary" type="submit"
                disabled={savingGroup || !groupName.trim()}>{savingGroup ? 'Creating…' : 'Create'}</button>
            </div>
          </form>
          </>
          )}
        </dialog>
      )}
    </div>
  )
}
