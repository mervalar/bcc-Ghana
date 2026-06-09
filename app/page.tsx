"use client"

import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import { eventsForDate, fromISO, summarize, toISO } from "@/lib/scheduler"
import { EVENT_META, MONTHS, WEEKDAYS } from "@/lib/event-style"
import { EventPanel } from "@/components/dashboard/event-panel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  HandHeart,
  Megaphone,
  Users,
} from "lucide-react"

export default function DashboardPage() {
  const { data, ready } = useStore()

  const today = toISO(new Date())
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const stats = useMemo(() => summarize(data.events), [data.events])

  const { days, firstWeekday } = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    return { days: daysInMonth, firstWeekday: firstDay.getDay() }
  }, [viewYear, viewMonth])

  const monthEvents = useMemo(() => {
    const map = new Map<string, ReturnType<typeof eventsForDate>>()
    for (let d = 1; d <= days; d++) {
      const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      const evs = eventsForDate(data.events, iso)
      if (evs.length) map.set(iso, evs)
    }
    return map
  }, [data.events, viewYear, viewMonth, days])

  const selectedEvents = useMemo(
    () => (selectedDate ? eventsForDate(data.events, selectedDate) : []),
    [data.events, selectedDate],
  )

  const upcoming = useMemo(() => {
    const todayDate = fromISO(today)
    return data.events
      .filter((e) => {
        const diff = (fromISO(e.date).getTime() - todayDate.getTime()) / 86400000
        return diff >= 0 && diff <= 14
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10)
  }, [data.events, today])

  const goToPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const goToNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }
  const goToToday = () => {
    const now = new Date()
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    selectDay(toISO(now))
  }

  const selectDay = (iso: string) => {
    setSelectedDate(iso)
    setPanelOpen(true)
  }

  const closePanel = () => {
    setPanelOpen(false)
    setSelectedDate(null)
  }

  if (!ready) return null

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ── Main column ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-5">
          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{data.settings.promotionName}</p>
        </div>

        <div className="flex flex-col gap-6 p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Users}      label="Students"    value={data.students.length} />
            <StatCard icon={BookOpen}   label="Lessons"     value={stats.lesson} />
            <StatCard icon={HandHeart}  label="Fellowships" value={stats.fellowship} />
            <StatCard icon={Megaphone}  label="Crusades"    value={stats.crusade} />
          </div>

          {/* Calendar */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {/* Month nav */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-foreground">
                  {MONTHS[viewMonth]} {viewYear}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={goToPrev} aria-label="Previous month" className="size-8">
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="sm" onClick={goToToday} className="h-8 px-3 text-xs">
                  Today
                </Button>
                <Button variant="ghost" size="icon" onClick={goToNext} aria-label="Next month" className="size-8">
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-2 text-center text-xs font-medium text-muted-foreground">
                  {w}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <div key={`e-${i}`} className="min-h-[88px] border-b border-r border-border last:border-r-0" />
              ))}

              {Array.from({ length: days }).map((_, i) => {
                const dayNum = i + 1
                const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
                const isToday = iso === today
                const isSelected = iso === selectedDate && panelOpen
                const dayEvents = monthEvents.get(iso) ?? []
                const isLastInRow = (firstWeekday + i) % 7 === 6
                const visible = dayEvents.slice(0, 3)
                const overflow = dayEvents.length - 3

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => selectDay(iso)}
                    className={cn(
                      "group flex min-h-[88px] flex-col gap-1 border-b border-r p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isLastInRow && "border-r-0",
                      isSelected ? "bg-primary/5" : "hover:bg-muted/50",
                      "border-border",
                    )}
                    aria-label={`${MONTHS[viewMonth]} ${dayNum}`}
                    aria-pressed={isSelected}
                  >
                    {/* Day number */}
                    <span
                      className={cn(
                        "ml-0.5 flex size-6 items-center justify-center self-start rounded-full text-xs font-medium",
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : isSelected
                            ? "text-primary font-semibold"
                            : "text-foreground",
                      )}
                    >
                      {dayNum}
                    </span>

                    {/* Event chips */}
                    <div className="flex flex-col gap-1 w-full">
                      {visible.map((e) => {
                        const meta = EVENT_META[e.type]
                        const Icon = meta.icon
                        const label = e.type === "birthday"
                          ? e.title.replace(/'s Birthday$/, "")
                          : e.title

                        if (e.type === "birthday") {
                          return (
                            <div
                              key={e.id}
                              className={cn(
                                "flex flex-col items-center gap-0.5 rounded-md px-1 py-1.5 w-full text-center",
                                meta.chip,
                              )}
                              title={label}
                            >
                              <Icon className="size-4 shrink-0" aria-hidden="true" />
                              <span className="text-[11px] font-semibold leading-tight w-full truncate">{label}</span>
                            </div>
                          )
                        }

                        return (
                          <div
                            key={e.id}
                            className={cn(
                              "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight",
                              meta.chip,
                            )}
                            title={label}
                          >
                            <span className="truncate">{label}</span>
                          </div>
                        )
                      })}
                      {overflow > 0 && (
                        <p className="px-1 text-[10px] text-muted-foreground">+{overflow} more</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 px-1">
            {(["lesson", "fellowship", "crusade", "birthday"] as const).map((type) => {
              const meta = EVENT_META[type]
              return (
                <div key={type} className="flex items-center gap-1.5">
                  <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden="true" />
                  <span className="text-xs text-muted-foreground">{meta.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Right sidebar: switches between event detail and upcoming events ── */}
      <aside className="w-full shrink-0 border-t border-border bg-card lg:w-80 lg:border-l lg:border-t-0">
        <div className="sticky top-0 max-h-screen overflow-y-auto">
          {panelOpen && selectedDate ? (
            /* Event detail drawer */
            <EventPanel
              date={selectedDate}
              events={selectedEvents}
              onClose={closePanel}
            />
          ) : (
            /* Upcoming events */
            <UpcomingPanel
              upcoming={upcoming}
              hasData={data.events.length > 0}
              onEventClick={(iso) => {
                setViewYear(Number(iso.split("-")[0]))
                setViewMonth(Number(iso.split("-")[1]) - 1)
                selectDay(iso)
              }}
            />
          )}
        </div>
      </aside>
    </div>
  )
}

/* ── Upcoming events panel ── */

function UpcomingPanel({
  upcoming,
  hasData,
  onEventClick,
}: {
  upcoming: ReturnType<typeof eventsForDate>
  hasData: boolean
  onEventClick: (iso: string) => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Upcoming</p>
        <h2 className="mt-1 text-base font-semibold text-foreground">Next 14 days</h2>
      </div>

      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <CalendarDays className="size-8 text-muted-foreground/30" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {hasData
              ? "Nothing scheduled in the next 14 days."
              : "Import classes & lessons from Settings to generate the schedule."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {upcoming.map((e) => {
            const meta = EVENT_META[e.type]
            const Icon = meta.icon
            const [, m, d] = e.date.split("-").map(Number)
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onEventClick(e.date)}
                  className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/60"
                >
                  <div className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-sm",
                    meta.chip.split(" ").filter(c => c.startsWith("bg-") || c.startsWith("text-")).join(" "),
                  )}>
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{MONTHS[m - 1]} {d}</p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ── Stat card ── */

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
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
