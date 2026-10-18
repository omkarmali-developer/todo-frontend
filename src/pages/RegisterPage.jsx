import { useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { registerUser } from '../api/authApi'
import { createTenant } from '../api/tenantApi'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'
import { getPlanById, SELECTED_PLAN_KEY } from '../data/plans'

export default function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setTenantKey } = useTenant()
  const { isAuthenticated } = useAuth()
  const planId = location.state?.planId || localStorage.getItem(SELECTED_PLAN_KEY) || 'starter'
  const plan = useMemo(() => getPlanById(planId), [planId])
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/todos" replace />
  }

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const normalizedUser = form.username.trim().toLowerCase()
    if (!normalizedUser) {
      setError('Username is required.')
      return
    }

    setLoading(true)
    try {
      setTenantKey(normalizedUser)
      try {
        await createTenant(normalizedUser, plan.id)
      } catch (tenantErr) {
        const status = tenantErr.status
        const msg = (tenantErr.message || '').toLowerCase()
        const alreadyExists =
          status === 409 ||
          msg.includes('already exists') ||
          msg.includes('conflict')
        if (!alreadyExists) {
          throw tenantErr
        }
      }

      localStorage.setItem(SELECTED_PLAN_KEY, plan.id)

      await registerUser({
        name: form.name.trim(),
        username: normalizedUser,
        email: form.email.trim(),
        password: form.password,
      })
      navigate('/login', {
        state: { registered: true, username: normalizedUser, planId: plan.id },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gate">
      <div className="panel gate-card">
        <div className="brand">
          <div className="brand-mark">TF</div>
          <div>
            <h1>Create account</h1>
            <p>Your username becomes your private workspace</p>
          </div>
        </div>

        <div className="plan-chip">
          <span>Selected plan</span>
          <strong>{plan.name}</strong>
          <span>
            {plan.priceLabel}
            {plan.period !== 'forever' ? ` ${plan.period}` : ` ${plan.period}`}
          </span>
          <Link to="/pricing">Change</Link>
        </div>

        <p className="lede">
          We create tenant database <code>todo_&lt;username&gt;</code> and register you there.
        </p>

        {error ? <div className="alert alert-error">{error}</div> : null}

        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Full name
            <input
              required
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              autoComplete="name"
            />
          </label>
          <label>
            Username
            <input
              required
              value={form.username}
              onChange={(e) => setField('username', e.target.value)}
              autoComplete="username"
              pattern="[a-zA-Z][a-zA-Z0-9_]{1,62}"
              title="Start with a letter; letters, numbers, underscore only"
              placeholder="e.g. omkar"
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              minLength={4}
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <div className="actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Register'}
            </button>
          </div>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
          {' · '}
          <Link to="/pricing">View pricing</Link>
        </p>
      </div>
    </div>
  )
}
