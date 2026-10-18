import { createContext, useContext, useMemo, useState } from 'react'

const TenantContext = createContext(null)

export function TenantProvider({ children }) {
  const [tenantKey, setTenantKeyState] = useState(
    () => localStorage.getItem('tenantKey') || '',
  )

  const setTenantKey = (key) => {
    const normalized = (key || '').trim().toLowerCase()
    setTenantKeyState(normalized)
    if (normalized) {
      localStorage.setItem('tenantKey', normalized)
    } else {
      localStorage.removeItem('tenantKey')
    }
  }

  const clearTenant = () => setTenantKey('')

  const value = useMemo(
    () => ({ tenantKey, setTenantKey, clearTenant, isReady: Boolean(tenantKey) }),
    [tenantKey],
  )

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return ctx
}
