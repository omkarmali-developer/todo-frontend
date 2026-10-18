import api from './client'

export async function fetchPlans() {
  const { data } = await api.get('/plans')
  return data
}

export async function fetchSubscription() {
  const { data } = await api.get('/subscription')
  return data
}
