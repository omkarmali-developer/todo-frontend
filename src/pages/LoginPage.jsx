import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { loginUser } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setTenantKey } = useTenant()
  const { isAuthenticated, setSession } = useAuth()
  const [username, setUsername] = useState(location.state?.username || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info] = useState(
    location.state?.registered ? 'Account created. Please sign in.' : '',
  )

  if (isAuthenticated) {
    return <Navigate to="/todos" replace />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const normalized = username.trim().toLowerCase()
    if (!normalized) {
      setError('Username is required.')
      return
    }
    setLoading(true)
    try {
      // Username is the tenant key (X-Tenant-Id) for this multi-tenant app.
      setTenantKey(normalized)
      await loginUser({ usernameOrEmail: normalized, password })
      setSession(normalized, password)
      navigate('/todos')
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
            <h1>Sign in</h1>
            <p>Your username identifies your workspace</p>
          </div>
        </div>

        <p className="lede">
          Sign in with your username. It is also sent as <code>X-Tenant-Id</code> so data stays in
          your tenant database.
        </p>

        {info ? <div className="alert alert-ok">{info}</div> : null}
        {error ? <div className="alert alert-error">{error}</div> : null}

        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Username
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              pattern="[a-zA-Z][a-zA-Z0-9_]{1,62}"
              title="Start with a letter; letters, numbers, underscore only"
              placeholder="e.g. omkar"
            />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <div className="actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>

        <p className="auth-switch">
          New here? <Link to="/pricing">See pricing</Link>
          {' · '}
          <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  )
}
