'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, getToken, setToken, removeToken, setUserData, getUserData } from '@/lib/api'
import type { UserResponse, LoginRequest, RegisterRequest } from '@/lib/api'

interface AuthContextType {
  user: UserResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      // Try to get cached user first for instant display
      const cached = getUserData()
      if (cached && cached._id) {
        setUser(cached as unknown as UserResponse)
      }

      // Then fetch fresh data from server
      const freshUser = await authApi.me()
      setUser(freshUser)
      setUserData(freshUser)
    } catch {
      removeToken()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (data: LoginRequest) => {
    setIsLoading(true)
    try {
      const response = await authApi.login(data)
      setToken(response.access_token)
      setUserData(response.user)
      setUser(response.user)
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterRequest) => {
    setIsLoading(true)
    try {
      await authApi.register(data)
      // After registration, auto-login
      await login({ email: data.email, password: data.password })
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    removeToken()
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && !!getToken(),
        login,
        register,
        logout,
        refreshUser,
      }}
    >
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