import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const tenantKey = localStorage.getItem('tenantKey')
  const url = config.url || ''

  // Tenant APIs (except creating tenants) need X-Tenant-Id
  if (tenantKey && !url.startsWith('/tenants')) {
    config.headers['X-Tenant-Id'] = tenantKey
  }

  // Todo + subscription require HTTP Basic (tenant user). Auth/login/register stay open.
  const needsBasic =
    url.startsWith('/todos') ||
    url.includes('/todos/') ||
    url.startsWith('/subscription')
  if (needsBasic) {
    const username = sessionStorage.getItem('authUsername')
    const password = sessionStorage.getItem('authPassword')
    if (username && password) {
      config.auth = { username, password }
    }
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data
    const message =
      data?.message ||
      data?.detail ||
      data?.error ||
      (typeof data === 'string' ? data : null) ||
      error.message ||
      'Request failed'
    const err = new Error(message)
    err.status = error.response?.status
    return Promise.reject(err)
  },
)

export default api
