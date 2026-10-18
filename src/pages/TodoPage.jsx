import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchSubscription } from '../api/plansApi'
import {
  completeTodo,
  createTodo,
  deleteTodo,
  incompleteTodo,
  listTodos,
  updateTodo,
} from '../api/todoApi'
import TodoForm from '../components/TodoForm'
import TodoItem from '../components/TodoItem'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'

const NAV = [
  { id: 'home', label: 'Today', icon: 'sun' },
  { id: 'upcoming', label: 'Upcoming', icon: 'cal' },
  { id: 'completed', label: 'Completed', icon: 'check' },
]

function greetingForNow() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning!'
  if (hour < 17) return 'Good Afternoon!'
  return 'Good Evening!'
}

function formatShortDate(date = new Date()) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function weekRangeLabel() {
  const start = new Date()
  start.setDate(start.getDate() + 1)
  const end = new Date()
  end.setDate(end.getDate() + 7)
  const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

function parseCreatedFor(value) {
  if (value == null || value === '') return null

  // Jackson timestamp array: [year, month, day, hour, minute, second?]
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d, h = 0, min = 0, s = 0] = value
    const parsed = new Date(y, m - 1, d, h, min, s)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  if (typeof value === 'object' && value.year != null && value.monthValue != null) {
    const parsed = new Date(
      value.year,
      value.monthValue - 1,
      value.dayOfMonth ?? value.day ?? 1,
      value.hour ?? 0,
      value.minute ?? 0,
      value.second ?? 0,
    )
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const raw = String(value)
  // Prefer local parse for "YYYY-MM-DDTHH:mm:ss" (no Z) so IST dates stay on the same day.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw) && !/[zZ]|[+-]\d{2}:\d{2}$/.test(raw)) {
    const [datePart, timePart = '00:00:00'] = raw.split('T')
    const [y, m, d] = datePart.split('-').map(Number)
    const [h = 0, min = 0, s = 0] = timePart.split(':').map(Number)
    const parsed = new Date(y, m - 1, d, h, min, Math.floor(s))
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return parsed
  return null
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Today section: time only. Upcoming: date + time. */
function formatTaskWhen(value, { includeDate = false } = {}) {
  const date = parseCreatedFor(value)
  if (!date) return ''
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (!includeDate) return time
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`
}

function formatTodoUsage(subscription) {
  if (!subscription) return ''
  const used = subscription.todoCount ?? 0
  const max = subscription.maxTodos
  if (max == null) return `${used} todos · Unlimited`
  return `${used} / ${max} todos`
}

function ringStyle(pct) {
  const angle = Math.round(Math.min(100, Math.max(0, pct)) * 3.6)
  return {
    background: `conic-gradient(#22c55e ${angle}deg, #e5e7eb ${angle}deg)`,
  }
}

function TaskGroup({ title, subtitle, icon, tasks, loading, busyId, onToggle, onEdit, onDelete, whenOpts, onSort, sortAsc }) {
  return (
    <section className="tf-section">
      <div className="tf-section-head">
        <div>
          <h2>
            <span className={`tf-nav-icon tf-ico-${icon}`} aria-hidden />
            {title}
          </h2>
          {subtitle ? (
            <p>
              <span className="tf-nav-icon tf-ico-cal" aria-hidden />
              {subtitle}
            </p>
          ) : null}
        </div>
        {onSort ? (
          <button type="button" className="tf-sort" onClick={onSort}>
            Sort {sortAsc ? '↑' : '↓'}
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="tf-empty">Loading…</div>
      ) : tasks.length === 0 ? (
        <div className="tf-empty">No tasks here yet.</div>
      ) : (
        <div className="tf-task-group">
          {tasks.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              busyId={busyId}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              whenLabel={formatTaskWhen(todo.createdFor ?? todo.created_for, whenOpts)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default function TodoPage() {
  const navigate = useNavigate()
  const { tenantKey, clearTenant } = useTenant()
  const { username, clearSession } = useAuth()
  const [todos, setTodos] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [nav, setNav] = useState('home')
  const [search, setSearch] = useState('')
  const [sortAsc, setSortAsc] = useState(true)
  const [mobileNav, setMobileNav] = useState(false)

  const loadSubscription = useCallback(async () => {
    try {
      const data = await fetchSubscription()
      setSubscription(data)
    } catch {
      setSubscription(null)
    }
  }, [])

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [data] = await Promise.all([listTodos(), loadSubscription()])
      setTodos(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
      setTodos([])
    } finally {
      setLoading(false)
    }
  }, [loadSubscription])

  useEffect(() => {
    load()
  }, [load])

  const expired = Boolean(subscription?.expired)
  const renewalMessage =
    subscription?.renewalMessage ||
    'Your subscription period has ended. Renew your plan to create new todos.'

  const openTodos = useMemo(() => todos.filter((t) => !t.completed), [todos])
  const doneTodos = useMemo(() => todos.filter((t) => t.completed), [todos])

  const applySearchSort = useCallback(
    (list) => {
      let next = [...list]
      const q = search.trim().toLowerCase()
      if (q) {
        next = next.filter(
          (t) =>
            (t.title || '').toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q),
        )
      }
      next.sort((a, b) => {
        const da = parseCreatedFor(a.createdFor)?.getTime() ?? Number.MAX_SAFE_INTEGER
        const db = parseCreatedFor(b.createdFor)?.getTime() ?? Number.MAX_SAFE_INTEGER
        return sortAsc ? da - db : db - da
      })
      return next
    },
    [search, sortAsc],
  )

  /** Today + overdue open tasks (missing dates stay in Today so nothing disappears). */
  const todayTasks = useMemo(() => {
    const endToday = startOfDay(new Date())
    endToday.setHours(23, 59, 59, 999)
    return applySearchSort(
      openTodos.filter((t) => {
        const d = parseCreatedFor(t.createdFor ?? t.created_for)
        if (!d) return true
        return d.getTime() <= endToday.getTime()
      }),
    )
  }, [openTodos, applySearchSort])

  /** Future open tasks (after end of today). */
  const upcomingTasks = useMemo(() => {
    const endToday = startOfDay(new Date())
    endToday.setHours(23, 59, 59, 999)
    return applySearchSort(
      openTodos.filter((t) => {
        const d = parseCreatedFor(t.createdFor ?? t.created_for)
        return d && d.getTime() > endToday.getTime()
      }),
    )
  }, [openTodos, applySearchSort])

  const completedTasks = useMemo(() => applySearchSort(doneTodos), [doneTodos, applySearchSort])

  const counts = useMemo(
    () => ({
      home: todayTasks.length,
      upcoming: upcomingTasks.length,
      completed: doneTodos.length,
    }),
    [todayTasks, upcomingTasks, doneTodos],
  )

  const priorityStats = useMemo(() => {
    const source = nav === 'completed' ? doneTodos : openTodos
    return {
      high: source.filter((t) => (t.priority || '').toUpperCase() === 'HIGH').length,
      medium: source.filter((t) => (t.priority || '').toUpperCase() === 'MEDIUM').length,
      low: source.filter((t) => (t.priority || '').toUpperCase() === 'LOW').length,
    }
  }, [nav, openTodos, doneTodos])

  const ringPct =
    openTodos.length + doneTodos.length === 0
      ? 0
      : (doneTodos.length / (openTodos.length + doneTodos.length)) * 100

  const onSubmit = async (form) => {
    if (!editing && expired) {
      setError(renewalMessage)
      return
    }
    setSubmitting(true)
    setError('')
    try {
      if (editing) {
        await updateTodo(editing.id, { ...form, id: editing.id })
        setEditing(null)
      } else {
        await createTodo(form)
      }
      await load()
    } catch (err) {
      setError(err.message)
      if ((err.message || '').toLowerCase().includes('renew')) {
        await loadSubscription()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const onToggle = async (todo) => {
    setBusyId(todo.id)
    setError('')
    try {
      if (todo.completed) await incompleteTodo(todo.id)
      else await completeTodo(todo.id)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const onDelete = async (id) => {
    if (!window.confirm('Delete this todo?')) return
    setBusyId(id)
    setError('')
    try {
      await deleteTodo(id)
      if (editing?.id === id) setEditing(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const logout = () => {
    clearSession()
    clearTenant()
    navigate('/login')
  }

  const focusAdd = () => {
    setNav('home')
    setMobileNav(false)
    requestAnimationFrame(() => {
      document.querySelector('.tf-quick-add input')?.focus()
    })
  }

  const toggleSort = () => setSortAsc((v) => !v)

  return (
    <div className="taskify">
      <aside className={`tf-sidebar ${mobileNav ? 'is-open' : ''}`}>
        <div className="tf-brand">
          <span className="tf-logo" aria-hidden />
          <span>Taskify</span>
        </div>

        <nav className="tf-nav" aria-label="Views">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`tf-nav-item ${nav === item.id ? 'is-active' : ''}`}
              onClick={() => {
                setNav(item.id)
                setMobileNav(false)
              }}
            >
              <span className={`tf-nav-icon tf-ico-${item.icon}`} aria-hidden />
              <span>{item.label}</span>
              <span className="tf-nav-count">{counts[item.id]}</span>
            </button>
          ))}
        </nav>

        <div className="tf-sidebar-foot">
          {subscription ? (
            <div className={`tf-plan-pill ${expired ? 'is-expired' : ''}`}>
              <span>{subscription.planName}</span>
              <small>{formatTodoUsage(subscription)}</small>
              <Link to="/pricing">{expired ? 'Renew' : 'Plans'}</Link>
            </div>
          ) : null}
          <button type="button" className="tf-settings" onClick={logout}>
            <span className="tf-nav-icon tf-ico-gear" aria-hidden />
            Log out
          </button>
        </div>
      </aside>

      {mobileNav ? (
        <button type="button" className="tf-backdrop" aria-label="Close menu" onClick={() => setMobileNav(false)} />
      ) : null}

      <main className="tf-main">
        <header className="tf-top">
          <button type="button" className="tf-burger" onClick={() => setMobileNav(true)} aria-label="Open menu">
            ☰
          </button>
          <div className="tf-greeting">
            <h1>
              {greetingForNow()} <span aria-hidden>👋</span>
            </h1>
            <p>Small steps make big progress.</p>
          </div>
          <div className="tf-top-tools">
            <label className="tf-search">
              <span className="tf-search-ico" aria-hidden />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
              />
            </label>
            <button type="button" className="tf-avatar" title={username || tenantKey} onClick={logout}>
              {(username || tenantKey || '?').slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>

        {expired ? (
          <div className="tf-banner warn">
            {renewalMessage} <Link to="/pricing">Renew your plan</Link>
          </div>
        ) : null}
        {error ? <div className="tf-banner error">{error}</div> : null}

        <TodoForm
          initial={null}
          onSubmit={onSubmit}
          submitting={submitting}
          disabled={expired}
          variant="quick"
        />

        {editing ? (
          <div className="tf-edit-panel">
            <h3>Edit task</h3>
            <TodoForm
              initial={editing}
              onSubmit={onSubmit}
              onCancel={() => setEditing(null)}
              submitting={submitting}
              variant="edit"
            />
          </div>
        ) : null}

        {nav === 'home' ? (
          <>
            <TaskGroup
              title="Today"
              subtitle={formatShortDate()}
              icon="sun"
              tasks={todayTasks}
              loading={loading}
              busyId={busyId}
              onToggle={onToggle}
              onEdit={setEditing}
              onDelete={onDelete}
              whenOpts={{ includeDate: false }}
              onSort={toggleSort}
              sortAsc={sortAsc}
            />
            <TaskGroup
              title="Upcoming"
              subtitle={weekRangeLabel()}
              icon="cal"
              tasks={upcomingTasks}
              loading={loading}
              busyId={busyId}
              onToggle={onToggle}
              onEdit={setEditing}
              onDelete={onDelete}
              whenOpts={{ includeDate: true }}
              onSort={toggleSort}
              sortAsc={sortAsc}
            />
          </>
        ) : null}

        {nav === 'upcoming' ? (
          <TaskGroup
            title="Upcoming"
            subtitle={weekRangeLabel()}
            icon="cal"
            tasks={upcomingTasks}
            loading={loading}
            busyId={busyId}
            onToggle={onToggle}
            onEdit={setEditing}
            onDelete={onDelete}
            whenOpts={{ includeDate: true }}
            onSort={toggleSort}
            sortAsc={sortAsc}
          />
        ) : null}

        {nav === 'completed' ? (
          <TaskGroup
            title="Completed"
            subtitle={`${completedTasks.length} done`}
            icon="check"
            tasks={completedTasks}
            loading={loading}
            busyId={busyId}
            onToggle={onToggle}
            onEdit={setEditing}
            onDelete={onDelete}
            whenOpts={{ includeDate: true }}
            onSort={toggleSort}
            sortAsc={sortAsc}
          />
        ) : null}
      </main>

      <aside className="tf-rail">
        <div className="tf-card">
          <h3>Today&apos;s Progress</h3>
          <div className="tf-progress">
            <div className="tf-ring" style={ringStyle(ringPct)}>
              <div className="tf-ring-inner">
                <strong>
                  {doneTodos.length}/{todos.length || 0}
                </strong>
                <span>tasks</span>
              </div>
            </div>
            <p>Keep going! You&apos;re doing great.</p>
          </div>
        </div>

        <div className="tf-card">
          <h3>Priority</h3>
          <ul className="tf-priority-stats">
            <li>
              <span className="tf-dot" style={{ background: '#ef4444' }} />
              High <strong>{priorityStats.high}</strong>
            </li>
            <li>
              <span className="tf-dot" style={{ background: '#3b82f6' }} />
              Medium <strong>{priorityStats.medium}</strong>
            </li>
            <li>
              <span className="tf-dot" style={{ background: '#22c55e' }} />
              Low <strong>{priorityStats.low}</strong>
            </li>
          </ul>
        </div>

        <div className="tf-card">
          <h3>Quick Actions</h3>
          <div className="tf-quick-actions">
            <button type="button" onClick={focusAdd}>
              <span className="tf-qa-ico">+</span> Add Task
            </button>
            <button type="button" onClick={() => setNav('home')}>
              <span className="tf-qa-ico tf-ico-sun" /> Today
            </button>
            <button type="button" onClick={() => setNav('upcoming')}>
              <span className="tf-qa-ico tf-ico-cal" /> Upcoming
            </button>
            <Link to="/pricing">
              <span className="tf-qa-ico tf-ico-gear" /> Plans
            </Link>
          </div>
        </div>

        <div className="tf-motivation">
          <div className="tf-motivation-art" aria-hidden />
          <p>Better days are built with good habits.</p>
        </div>
      </aside>
    </div>
  )
}
