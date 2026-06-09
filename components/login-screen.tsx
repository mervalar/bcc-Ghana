"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Lock } from "lucide-react"

export function LoginScreen() {
  const { login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ok = login(username.trim(), password)
    setError(!ok)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <BookOpen className="size-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Bible Study Manager</h1>
            <p className="text-sm text-muted-foreground">Promotion 2026–2027</p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              Invalid username or password.
            </p>
          )}

          <Button type="submit" className="mt-2 w-full gap-2">
            <Lock className="size-4" aria-hidden="true" />
            Sign in
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Default login: <span className="font-medium text-foreground">admin / admin</span>
          </p>
        </form>
      </div>
    </main>
  )
}
