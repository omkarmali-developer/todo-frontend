import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchPlans } from '../api/plansApi'
import { mapApiPlan, PRICING_PLANS, SELECTED_PLAN_KEY } from '../data/plans'

export default function PricingPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState(PRICING_PLANS)

  useEffect(() => {
    let cancelled = false
    fetchPlans()
      .then((data) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) {
          return
        }
        setPlans(data.map(mapApiPlan))
      })
      .catch(() => {
        // Keep local fallback catalog
      })
    return () => {
      cancelled = true
    }
  }, [])

  const choosePlan = (planId) => {
    localStorage.setItem(SELECTED_PLAN_KEY, planId)
    navigate('/register', { state: { planId } })
  }

  return (
    <div className="pricing-page">
      <header className="pricing-hero">
        <div className="brand">
          <div className="brand-mark">TF</div>
          <div>
            <h1>Taskify</h1>
            <p>Clear plans. Private tenant databases.</p>
          </div>
        </div>
        <nav className="pricing-nav">
          <Link to="/login" className="btn btn-ghost">
            Sign in
          </Link>
          <Link to="/register" className="btn btn-secondary">
            Register
          </Link>
        </nav>
      </header>

      <section className="pricing-intro">
        <h2>Pricing that stays out of your way</h2>
        <p>
          Pick a plan, register with your username, and your data lives in its own database —
          <code>todo_&lt;username&gt;</code>.
        </p>
      </section>

      <section className="pricing-grid" aria-label="Pricing plans">
        {plans.map((plan, index) => (
          <article
            key={plan.id}
            className={`pricing-card ${plan.highlighted ? 'is-featured' : ''}`}
            style={{ animationDelay: `${0.08 * index}s` }}
          >
            {plan.highlighted ? <span className="pricing-badge">Most popular</span> : null}
            <h3>{plan.name}</h3>
            <p className="pricing-tagline">{plan.tagline}</p>
            <div className="pricing-price">
              <span className="pricing-amount">{plan.priceLabel}</span>
              <span className="pricing-period">{plan.period}</span>
            </div>
            <ul className="pricing-features">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button
              type="button"
              className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'} pricing-cta`}
              onClick={() => choosePlan(plan.id)}
            >
              {plan.cta}
            </button>
          </article>
        ))}
      </section>

      <p className="pricing-footnote">
        Already registered? <Link to="/login">Sign in</Link> to your account.
      </p>
    </div>
  )
}
