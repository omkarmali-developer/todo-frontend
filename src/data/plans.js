/** Persisted when user picks a plan on /pricing. */
export const SELECTED_PLAN_KEY = 'selectedPlanId'

/** Fallback catalog if GET /api/plans is unavailable. */
export const PRICING_PLANS = [
  {
    id: 'starter',
    code: 'starter',
    name: 'Starter',
    tagline: 'For personal focus',
    priceMonthly: 0,
    priceLabel: 'Free',
    period: 'forever',
    cta: 'Start free',
    highlighted: false,
    features: [
      '1 workspace (your username)',
      'Up to 50 active todos',
      'Basic priorities',
      'Email support in 48h',
    ],
    limits: {
      maxTodos: 50,
      maxUsers: 1,
    },
  },
  {
    id: 'pro',
    code: 'pro',
    name: 'Pro',
    tagline: 'For builders who ship',
    priceMonthly: 0,
    priceLabel: 'Free',
    period: 'forever',
    cta: 'Start free',
    highlighted: true,
    features: [
      'Unlimited todos',
      'All priority levels',
      'Complete / incomplete filters',
      'Export-ready history',
      'Priority support',
    ],
    limits: {
      maxTodos: null,
      maxUsers: 1,
    },
  },
  {
    id: 'team',
    code: 'team',
    name: 'Team',
    tagline: 'For small squads',
    priceMonthly: 0,
    priceLabel: 'Free',
    period: 'forever',
    cta: 'Start free',
    highlighted: false,
    features: [
      'Everything in Pro',
      'Up to 10 users in one tenant',
      'Shared task board',
      'Admin role controls',
      'Onboarding help',
    ],
    limits: {
      maxTodos: null,
      maxUsers: 10,
    },
  },
]

/** Normalize API plan DTO to UI shape. */
export function mapApiPlan(plan) {
  const code = plan.code || plan.id
  return {
    id: code,
    code,
    name: plan.name,
    tagline: plan.tagline,
    priceMonthly: Math.round((plan.priceCents ?? 0) / 100),
    priceLabel: plan.priceLabel,
    period: plan.period,
    cta: plan.cta,
    highlighted: Boolean(plan.highlighted),
    features: plan.features || [],
    limits: {
      maxTodos: plan.limits?.maxTodos ?? null,
      maxUsers: plan.limits?.maxUsers ?? 1,
    },
  }
}

export function getPlanById(planId, plans = PRICING_PLANS) {
  return plans.find((p) => p.id === planId || p.code === planId) || plans[0]
}
