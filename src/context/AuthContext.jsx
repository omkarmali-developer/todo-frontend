import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

const USER_KEY = 'authUsername'
const PASS_KEY = 'authPassword'

function readSession() {
  return {
    username: sessionStorage.getItem(USER_KEY) || '',
    password: sessionStorage.getItem(PASS_KEY) || '',
  }
}

export function AuthProvider({ children }) {
  const [{ username, password }, setCreds] = useState(readSession)

  const setSession = (user, pass) => {
    const nextUser = (user || '').trim()
    const nextPass = pass || ''
    if (nextUser && nextPass) {
      sessionStorage.setItem(USER_KEY, nextUser)
      sessionStorage.setItem(PASS_KEY, nextPass)
    } else {
      sessionStorage.removeItem(USER_KEY)
      sessionStorage.removeItem(PASS_KEY)
    }
    setCreds({ username: nextUser, password: nextPass })
  }

  const clearSession = () => setSession('', '')

  const value = useMemo(
    () => ({
      username,
      password,
      isAuthenticated: Boolean(username && password),
      setSession,
      clearSession,
    }),
    [username, password],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
