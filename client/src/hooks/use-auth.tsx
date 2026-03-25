import { useState, useEffect, createContext, useContext } from 'react'
import { apiGet, apiPost } from '#/lib/api'

interface User {
  id?: string
  email: string
}

interface AuthContextType {
  user: User | null
  login: (user: User) => void
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const bootstrapAuth = async () => {
      try {
        const response = await apiGet<{ data: User }>('/api/v1/auth/me')
        if (isMounted) {
          setUser(response.data)
        }
      } catch {
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    bootstrapAuth()

    return () => {
      isMounted = false
    }
  }, [])

  const login = (newUser: User) => {
    setUser(newUser)
    setIsLoading(false)
  }

  const logout = async () => {
    try {
      await apiPost('/api/v1/auth/logout')
    } finally {
      setUser(null)
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
