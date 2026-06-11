"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { LoginScreen } from "@/components/login-screen"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  NotebookPen,
  Settings,
  Users,
  X,
} from "lucide-react"

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/students", label: "Students", icon: Users },
  { href: "/meetings", label: "Minutes & Meetings", icon: NotebookPen },
  { href: "/settings", label: "Settings & Import", icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { authed, ready, logout, username } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="size-5 animate-pulse" aria-hidden="true" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    )
  }

  if (!authed) return <LoginScreen />

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <BookOpen className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">Bible Study</p>
          <p className="truncate text-xs text-muted-foreground">Bible Study Manager</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2" aria-label="Main navigation">
        {NAV.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">Signed in as</p>
            <p className="truncate text-sm font-medium text-sidebar-foreground">{username}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            aria-label="Sign out"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-secondary">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="sticky top-0 h-screen">{SidebarContent}</div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-sidebar shadow-xl">
            <div className="flex justify-end p-2">
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="size-5" aria-hidden="true" />
              </Button>
            </div>
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="size-5" aria-hidden="true" />
          </Button>
          <span className="text-sm font-semibold">Bible Study Manager</span>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
