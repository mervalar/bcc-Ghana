"use client"

import { createContext, useContext, useEffect, useState } from "react"

interface Credentials {
  username: string
  password: string
}

interface AuthContextValue {
  authed: boolean
  ready: boolean
  username: string
  login: (username: string, password: string) => boolean
  logout: () => void
  changeCredentials: (creds: Credentials) => void
}

const CREDS_KEY = "bsm:creds"
const SESSION_KEY = "bsm:session"
const DEFAULT_CREDS: Credentials = { username: "admin", password: "admin" }

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [creds, setCreds] = useState<Credentials>(DEFAULT_CREDS)
  const [authed, setAuthed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const storedCreds = localStorage.getItem(CREDS_KEY)
      if (storedCreds) setCreds(JSON.parse(storedCreds))
      const session = localStorage.getItem(SESSION_KEY)
      if (session === "1") setAuthed(true)
    } catch {
      // ignore
    }
    setReady(true)
  }, [])

  const login = (username: string, password: string) => {
    if (username === creds.username && password === creds.password) {
      setAuthed(true)
      try {
        localStorage.setItem(SESSION_KEY, "1")
      } catch {
        // ignore
      }
      return true
    }
    return false
  }

  const logout = () => {
    setAuthed(false)
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      // ignore
    }
  }

  const changeCredentials = (next: Credentials) => {
    setCreds(next)
    try {
      localStorage.setItem(CREDS_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider
      value={{ authed, ready, username: creds.username, login, logout, changeCredentials }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
