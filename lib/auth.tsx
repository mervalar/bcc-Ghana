"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase, rowToCredentials } from "./supabase"
import { toast } from "sonner"

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

const LEGACY_CREDS_KEY = "bsm:creds"
const SESSION_KEY = "bsm:session"
const CREDS_ROW_ID = "admin"
const DEFAULT_CREDS: Credentials = {
  username: process.env.NEXT_PUBLIC_ADMIN_USERNAME ?? "",
  password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "",
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [creds, setCreds] = useState<Credentials>(DEFAULT_CREDS)
  const [authed, setAuthed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from("app_credentials").select("*").eq("id", CREDS_ROW_ID).maybeSingle()
        if (data) {
          setCreds(rowToCredentials(data))
        } else {
          // No row yet — migrate any credentials this browser previously stored locally
          // so the device that has the "real" current password becomes the shared source.
          let legacy: Credentials | null = null
          try {
            const stored = localStorage.getItem(LEGACY_CREDS_KEY)
            if (stored) legacy = JSON.parse(stored)
          } catch {
            // ignore
          }
          const initial = legacy ?? DEFAULT_CREDS
          setCreds(initial)
          const { error } = await supabase.from("app_credentials").upsert({ id: CREDS_ROW_ID, ...initial })
          if (!error && legacy) {
            try { localStorage.removeItem(LEGACY_CREDS_KEY) } catch { /* ignore */ }
          }
        }
      } catch {
        // Supabase unreachable / table not migrated yet — fall back to the env default
      }
      try {
        const session = localStorage.getItem(SESSION_KEY)
        if (session === "1") setAuthed(true)
      } catch {
        // ignore
      }
      setReady(true)
    }
    load()
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
    supabase.from("app_credentials").upsert({ id: CREDS_ROW_ID, ...next })
      .then(({ error }) => {
        if (error) toast.error("Failed to sync credentials to the database — other devices won't see this change until the app_credentials table exists in Supabase.")
      })
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
