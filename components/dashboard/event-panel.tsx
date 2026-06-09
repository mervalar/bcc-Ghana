"use client"

import { useEffect, useState } from "react"
import type { CalendarEvent } from "@/lib/types"
import { useStore } from "@/lib/store"
import { EVENT_META, formatLongDate } from "@/lib/event-style"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Save, X } from "lucide-react"

interface Props {
  date: string | null
  events: CalendarEvent[]
  onClose: () => void
}

export function EventPanel({ date, events, onClose }: Props) {
  const { updateEvent } = useStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = events.find((e) => e.id === selectedId) ?? null

  // auto-select first event when the day changes
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
                </button>
              )
            })}
          </div>

          {selected && <EventEditor key={selected.id} event={selected} onSave={(p) => {
            updateEvent(selected.id, p)
            toast.success("Event updated.")
          }} />}
        </div>
      )}
    </div>
  )
}

function EventEditor({
  event,
  onSave,
}: {
  event: CalendarEvent
  onSave: (patch: Partial<CalendarEvent>) => void
}) {
  const meta = EVENT_META[event.type]
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description)
  const [reference, setReference] = useState(event.reference ?? "")

  const isLesson = event.type === "lesson"

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className={meta.badge}>
          {meta.label}
        </Badge>
        {event.edited && (
          <span className="text-xs text-muted-foreground">edited</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ev-title">Title</Label>
        <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      {isLesson && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="ev-ref">Scripture reference</Label>
          <Input id="ev-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="ev-desc">Description</Label>
        <Textarea
          id="ev-desc"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <Button
        className="mt-auto gap-2 self-start"
        onClick={() => onSave({ title, description, reference: isLesson ? reference : undefined })}
      >
        <Save className="size-4" aria-hidden="true" />
        Save changes
      </Button>
    </div>
  )
}
