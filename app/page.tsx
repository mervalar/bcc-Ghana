"use client"

import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import { eventsForDate, filterByPromotion, fromISO, summarize, toISO } from "@/lib/scheduler"
import { EVENT_META, MONTHS } from "@/lib/event-style"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BookOpen,
  CalendarDays,
  HandHeart,
  Megaphone,
  Users,
  ArrowRight,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export default function DashboardPage() {
  const { data, ready } = useStore()
  const [promoId, setPromoId] = useState("all")

  const today = toISO(new Date())

  const filteredEvents = useMemo(
    () => filterByPromotion(data.events, promoId),
    [data.events, promoId],
  )

  const stats = useMemo(() => summarize(filteredEvents), [filteredEvents])

  const upcoming = useMemo(() => {
    const todayDate = fromISO(today)
    return filteredEvents
      .filter((e) => {
        const diff = (fromISO(e.date).getTime() - todayDate.getTime()) / 86400000
        return diff >= 0 && diff <= 30
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 20)
  }, [filteredEvents, today])

  const upcomingByDate = useMemo(() => {
    const groups: { date: string; events: typeof upcoming }[] = []
    for (const e of upcoming) {
      const last = groups[groups.length - 1]
      if (last && last.date === e.date) {
        last.events.push(e)
      } else {
        groups.push({ date: e.date, events: [e] })
      }
    }
    return groups
  }, [upcoming])

  const selectedPromoName = useMemo(() => {
    if (promoId === "all") return "All promotions"
    return data.settings.promotions.find((p) => p.id === promoId)?.name ?? "All promotions"
  }, [promoId, data.settings.promotions])

  if (!ready) return null

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{selectedPromoName}</p>
          </div>
          {data.settings.promotions.length > 0 && (
            <Select value={promoId} onValueChange={setPromoId}>
              <SelectTrigger className="w-auto min-w-44" size="sm">
                <SelectValue placeholder="Filter by promotion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All promotions</SelectItem>
                {data.settings.promotions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={Users}     label="Students"    value={data.students.length} />
          <StatCard icon={BookOpen}  label="Lessons"     value={stats.lesson} />
          <StatCard icon={HandHeart} label="Fellowships" value={stats.fellowship} />
          <StatCard icon={Megaphone} label="Crusades"    value={stats.crusade} />
        </div>

        {/* Upcoming events */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Upcoming — next 30 days</h2>
            <Link
              href="/calendar"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View calendar
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </div>

          {upcomingByDate.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-16 text-center">
              <CalendarDays className="size-8 text-muted-foreground/30" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                {data.events.length === 0
                  ? "No schedule yet. Import classes & lessons from Settings."
                  : "Nothing scheduled in the next 30 days."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {upcomingByDate.map(({ date, events: dayEvents }) => {
                const [y, m, d] = date.split("-").map(Number)
                const dateObj = new Date(y, m - 1, d)
                const isToday = date === today
                const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" })
                const monthDay = `${MONTHS[m - 1].slice(0, 3)} ${d}`

                return (
                  <Link key={date} href={`/calendar?date=${date}`}>
                    <div className="flex gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-muted/40 cursor-pointer">
                      {/* Date column */}
                      <div className={cn(
                        "flex w-14 shrink-0 flex-col items-center justify-center rounded-lg py-2 text-center",
                        isToday ? "bg-primary text-primary-foreground" : "bg-muted/60",
                      )}>
                        <span className={cn("text-[11px] font-medium uppercase", isToday ? "text-primary-foreground/80" : "text-muted-foreground")}>
                          {weekday}
                        </span>
                        <span className={cn("text-lg font-bold leading-tight", isToday ? "text-primary-foreground" : "text-foreground")}>
                          {d}
                        </span>
                        <span className={cn("text-[11px]", isToday ? "text-primary-foreground/80" : "text-muted-foreground")}>
                          {monthDay.split(" ")[0]}
                        </span>
                      </div>

                      {/* Events column */}
                      <div className="flex flex-1 flex-col justify-center gap-1.5 min-w-0">
                        {dayEvents.map((e) => {
                          const meta = EVENT_META[e.type]
                          const Icon = meta.icon
                          const label = e.type === "birthday"
                            ? e.title.replace(/'s Birthday$/, "")
                            : e.title
                          return (
                            <div key={e.id} className="flex items-center gap-2">
                              <span className={cn("flex size-5 shrink-0 items-center justify-center rounded", meta.chip.split(" ").filter(c => c.startsWith("bg-") || c.startsWith("text-")).join(" "))}>
                                <Icon className="size-3" aria-hidden="true" />
                              </span>
                              <span className="truncate text-sm text-foreground">{label}</span>
                              <span className={cn("ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", meta.chip)}>
                                {meta.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-none text-foreground">{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
