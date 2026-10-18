import api from './client'

export async function createTenant(tenantKey, planCode = 'starter') {
  const { data } = await api.post('/tenants', { tenantKey, planCode })
  return data
}
