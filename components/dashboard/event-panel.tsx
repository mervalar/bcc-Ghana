"use client"

import { useEffect, useState } from "react"
import type { CalendarEvent } from "@/lib/types"
import { useStore } from "@/lib/store"
import { EVENT_META, formatLongDate, MONTHS } from "@/lib/event-style"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CalendarCheck, CalendarClock, X } from "lucide-react"
import { fromISO } from "@/lib/scheduler"

interface Props {
  date: string | null
  events: CalendarEvent[]
  onClose: () => void
}

export function EventPanel({ date, events, onClose }: Props) {
  const { markLessonDone, postponeLesson } = useStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = events.find((e) => e.id === selectedId) ?? null

  useEffect(() => {
    setSelectedId(events.length ? events[0].id : null)
  }, [date, events])

  if (!date) return null

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-border p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Day details</p>
          <h2 className="mt-1 text-balance text-base font-semibold text-foreground">{formatLongDate(date)}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel" className="shrink-0">
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Nothing scheduled on this day.
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* event chips */}
          <div className="flex flex-wrap gap-2 border-b border-border p-4">
            {events.map((e) => {
              const meta = EVENT_META[e.type]
              const Icon = meta.icon
              const active = e.id === selectedId
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelectedId(e.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active ? meta.chip : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {meta.label}
                  {e.status === "done" && <span className="ml-0.5 text-emerald-600">✓</span>}
                  {e.status === "postponed" && <span className="ml-0.5 text-amber-500">→</span>}
                </button>
              )
            })}
          </div>

          {selected && (
            <EventDetail
              key={selected.id}
              event={selected}
              onDone={selected.type === "lesson" ? () => {
                markLessonDone(selected.id)
                toast.success("Lesson marked as done.")
              } : undefined}
              onPostpone={selected.type === "lesson" && selected.promotionId ? () => {
                postponeLesson(selected.id)
                toast.success("Lesson postponed — all following events shifted.")
              } : undefined}
            />
          )}
        </div>
      )}
    </div>
  )
}

function EventDetail({
  event,
  onDone,
  onPostpone,
}: {
  event: CalendarEvent
  onDone?: () => void
  onPostpone?: () => void
}) {
  const isDone      = event.status === "done"
  const isPostponed = event.status === "postponed"

  const d = fromISO(event.date)
  const formattedDate = `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">

      {/* Status badges — only shown when done/postponed */}
      {(isDone || isPostponed) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          {isDone && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
              <CalendarCheck className="size-3" aria-hidden="true" />Done
            </span>
          )}
          {isPostponed && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
              <CalendarClock className="size-3" aria-hidden="true" />Postponed
            </span>
          )}
        </div>
      )}

      {/* Content rows */}
      <div className="flex flex-1 flex-col divide-y divide-border">
        <DetailRow label="Date" value={formattedDate} />
        <DetailRow label="Title" value={event.title} />
        {event.description?.replace(/__ATTENDANCE__\[.*?\]/g, "").trim() && (
          <DetailRow label="Description" value={event.description.replace(/__ATTENDANCE__\[.*?\]/g, "").trim()} multiline />
        )}
      </div>

      {/* Action buttons — lessons only, pinned to bottom */}
      {(onDone || onPostpone) && (
        <div className="flex gap-2 border-t border-border px-5 py-4">
          {onDone && (
            <Button
              size="sm"
              variant="outline"
              className={isDone
                ? "gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"}
              onClick={onDone}
            >
              <CalendarCheck className="size-3.5" aria-hidden="true" />
              {isDone ? "Done ✓" : "Mark done"}
            </Button>
          )}
          {onPostpone && !isDone && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
              onClick={onPostpone}
            >
              <CalendarClock className="size-3.5" aria-hidden="true" />
              Postpone
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`text-sm text-foreground ${multiline ? "whitespace-pre-wrap leading-relaxed" : "font-medium"}`}>{value}</span>
    </div>
  )
}
