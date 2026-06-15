"use client"

import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import { filterByPromotion, fromISO, toISO } from "@/lib/scheduler"
import { EVENT_META, MONTHS } from "@/lib/event-style"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { CalendarEvent } from "@/lib/types"
import { promoColorByIndex, getPromoColor } from "@/lib/promo-colors"
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
  CheckCircle2,
  FileText,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { ReportDialog } from "@/components/dashboard/report-dialog"

/* ── helpers ── */

function computeStats(events: CalendarEvent[], today: string) {
  const allLessons     = events.filter((e) => e.type === "lesson")
  const lessonsTotal   = allLessons.length
  const lessonsDone    = allLessons.filter((e) => e.status === "done").length
  const lessonsLeft    = lessonsTotal - lessonsDone
  const fellowshipsLeft = events.filter((e) => e.type === "fellowship" && e.date >= today).length
  const crusadesLeft   = events.filter((e) => e.type === "crusade"   && e.date >= today).length
  return { lessonsTotal, lessonsDone, lessonsLeft, fellowshipsLeft, crusadesLeft }
}

/* ── page ── */

export default function DashboardPage() {
  const { data, ready } = useStore()
  const [promoId, setPromoId]       = useState("all")
  const [reportOpen, setReportOpen] = useState(false)

  const today = toISO(new Date())

  /* Stats — per promotion when "all" */
  const statsRows = useMemo(() => {
    if (promoId !== "all") {
      const promo = data.settings.promotions.find((p) => p.id === promoId)
      const evs = filterByPromotion(data.events, promoId)
      const students = data.students.filter((s) => s.promotionId === promoId).length
      const color = getPromoColor(promoId, data.settings.promotions)
      return [{ id: promoId, name: promo?.name ?? "Overview", students, color, ...computeStats(evs, today) }]
    }
    return data.settings.promotions.map((p, i) => {
      const evs = data.events.filter((e) => e.promotionId === p.id)
      const students = data.students.filter((s) => s.promotionId === p.id).length
      return { id: p.id, name: p.name, students, color: promoColorByIndex(i), ...computeStats(evs, today) }
    })
  }, [promoId, data.events, data.students, data.settings.promotions, today])

  /* Upcoming — next 14 days */
  const upcoming = useMemo(() => {
    const evs = filterByPromotion(data.events, promoId)
    const todayDate = fromISO(today)
    return evs
      .filter((e) => {
        const diff = (fromISO(e.date).getTime() - todayDate.getTime()) / 86400000
        return diff >= 0 && diff <= 14
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [data.events, promoId, today])

  const upcomingSections = useMemo(() => {
    if (promoId !== "all") {
      const promo = data.settings.promotions.find((p) => p.id === promoId)
      const color = getPromoColor(promoId, data.settings.promotions)
      return [{ label: promo?.name ?? "Upcoming", events: upcoming, color }]
    }
    const sections: { label: string; events: CalendarEvent[]; color: ReturnType<typeof promoColorByIndex> }[] = []
    data.settings.promotions.forEach((promo, i) => {
      const evs = upcoming.filter((e) => e.promotionId === promo.id)
      if (evs.length > 0) sections.push({ label: promo.name, events: evs, color: promoColorByIndex(i) })
    })
    const birthdays = upcoming.filter((e) => !e.promotionId)
    if (birthdays.length > 0) sections.push({ label: "Birthdays", events: birthdays, color: promoColorByIndex(5) })
    return sections
  }, [promoId, upcoming, data.settings.promotions])

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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setReportOpen(true)}>
              <FileText className="size-4" aria-hidden="true" />
              Report
            </Button>
            {data.settings.promotions.length > 0 && (
              <Select value={promoId} onValueChange={(v) => setPromoId(v ?? "all")}>
                <SelectTrigger className="w-auto min-w-44" size="sm">
                  <SelectValue placeholder="Filter by promotion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All promotions</SelectItem>
                  {data.settings.promotions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-6">

        {/* ── Stats ── */}
        {promoId !== "all" ? (
          /* Single promotion — 4 cards */
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={Users}     label="Students in promo" value={statsRows[0].students} />
            <LessonStatCard total={statsRows[0].lessonsTotal} left={statsRows[0].lessonsLeft} done={statsRows[0].lessonsDone} />
            <StatCard icon={HandHeart} label="Fellowships left"  value={statsRows[0].fellowshipsLeft} />
            <StatCard icon={Megaphone} label="Crusades left"     value={statsRows[0].crusadesLeft} />
          </div>
        ) : (
          /* All promotions — per-promo breakdown */
          <div className="flex flex-col gap-3">
            <div className={cn("grid gap-4", statsRows.length > 1 ? "sm:grid-cols-2" : "grid-cols-1")}>
              {statsRows.map((row) => (
                <div key={row.id} className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="border-b border-border bg-muted/30 px-4 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: row.color.textDark }}>{row.name}</p>
                  </div>
                  <div className="grid grid-cols-4 divide-x divide-border">
                    <MiniStat icon={Users}     label="Students"         value={row.students} />
                    <MiniStat icon={BookOpen}  label="Lessons left"     value={row.lessonsLeft} sub={`of ${row.lessonsTotal}`} />
                    <MiniStat icon={HandHeart} label="Fellowships left" value={row.fellowshipsLeft} />
                    <MiniStat icon={Megaphone} label="Crusades left"    value={row.crusadesLeft} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Upcoming ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Upcoming — next 14 days</h2>
            <Link
              href="/calendar"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View calendar
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </div>

          {upcomingSections.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center">
              <CalendarDays className="size-8 text-muted-foreground/30" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                {data.events.length === 0
                  ? "No schedule yet — import classes & lessons from Settings."
                  : "Nothing scheduled in the next 14 days."}
              </p>
            </div>
          ) : (
            <div className={cn("grid gap-4", upcomingSections.length > 1 ? "sm:grid-cols-2" : "grid-cols-1")}>
              {upcomingSections.map((section) => (
                <UpcomingCard key={section.label} label={section.label} events={section.events} today={today} color={section.color} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} data={data} />
    </div>
  )
}

/* ── Stat cards ── */

function StatCard({ icon: Icon, label, value, wide }: { icon: LucideIcon; label: string; value: number; wide?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-border bg-card p-4", wide && "sm:col-span-4")}>
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

function LessonStatCard({ total, left, done }: { total: number; left: number; done: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="flex flex-col justify-between gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BookOpen className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-semibold leading-none text-foreground">{left}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">Lessons left</p>
        </div>
      </div>
      {total > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <CheckCircle2 className="size-3 text-emerald-500" aria-hidden="true" />
              {done} done
            </span>
            <span className="text-[10px] text-muted-foreground">{pct}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}

function MiniStat({ icon: Icon, label, value, sub }: { icon: LucideIcon; label: string; value: number; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-3 py-3 text-center">
      <Icon className="size-4 text-primary" aria-hidden="true" />
      <p className="text-lg font-semibold leading-none text-foreground">{value}</p>
      {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
    </div>
  )
}

/* ── Upcoming card ── */

function UpcomingCard({ label, events, today, color }: { label: string; events: CalendarEvent[]; today: string; color: ReturnType<typeof promoColorByIndex> }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: color.textDark }}>{label}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {events.length} event{events.length !== 1 ? "s" : ""}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {events.map((e) => {
          const meta  = EVENT_META[e.type]
          const Icon  = meta.icon
          const [, m, d] = e.date.split("-").map(Number)
          const isToday = e.date === today
          const title = e.type === "birthday" ? e.title.replace(/'s Birthday$/, "") : e.title

          return (
            <li key={e.id}>
              <Link
                href={`/calendar?date=${e.date}`}
                className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-muted/40"
              >
                <span className={cn(
                  "w-11 shrink-0 rounded-md px-1.5 py-0.5 text-center text-[10px] font-semibold leading-tight",
                  isToday ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}>
                  {isToday ? "Today" : `${MONTHS[m - 1].slice(0, 3)} ${d}`}
                </span>
                <span className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded",
                  meta.chip.split(" ").filter((c) => c.startsWith("bg-") || c.startsWith("text-")).join(" "),
                )}>
                  <Icon className="size-3" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{title}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
