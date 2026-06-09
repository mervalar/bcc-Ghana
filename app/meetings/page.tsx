"use client"

import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import type { Meeting, Todo } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  CalendarDays,
  CheckSquare2,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Square,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ─── helpers ─── */

function formatDate(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/* ─── Meeting form dialog ─── */

interface MeetingFormProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  meeting: Meeting | null
}

function MeetingFormDialog({ open, onOpenChange, meeting }: MeetingFormProps) {
  const { addMeeting, updateMeeting } = useStore()
  const isEdit = !!meeting

  const [title, setTitle] = useState(meeting?.title ?? "")
  const [date, setDate] = useState(meeting?.date ?? todayISO())
  const [description, setDescription] = useState(meeting?.description ?? "")

  // sync when dialog opens with different meeting
  const resetForm = (m: Meeting | null) => {
    setTitle(m?.title ?? "")
    setDate(m?.date ?? todayISO())
    setDescription(m?.description ?? "")
  }

  const handleOpenChange = (o: boolean) => {
    if (o) resetForm(meeting)
    onOpenChange(o)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (isEdit && meeting) {
      updateMeeting(meeting.id, { title: title.trim(), date, description: description.trim() })
      toast.success("Meeting updated.")
    } else {
      addMeeting({ title: title.trim(), date, description: description.trim() })
      toast.success("Meeting added.")
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit meeting" : "New meeting"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the meeting details." : "Create a new meeting or minute record."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="mt-title">Title *</Label>
            <Input
              id="mt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Leadership meeting, Bible study review…"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="mt-date">Date *</Label>
            <Input
              id="mt-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="mt-desc">Notes / minutes</Label>
            <Textarea
              id="mt-desc"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write meeting notes or minutes here…"
            />
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? "Save changes" : "Create meeting"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Todo row ─── */

function TodoRow({ todo, onToggle, onDelete, onEdit }: {
  todo: Todo
  onToggle: () => void
  onDelete: () => void
  onEdit: (text: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(todo.text)

  const commit = () => {
    if (val.trim()) onEdit(val.trim())
    setEditing(false)
  }

  return (
    <li className="flex items-start gap-3 px-4 py-2.5 group">
      <Checkbox
        checked={todo.done}
        onCheckedChange={onToggle}
        className="mt-0.5 shrink-0"
        aria-label={todo.done ? "Mark as pending" : "Mark as done"}
      />
      {editing ? (
        <Input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false) }}
          className="h-7 flex-1 text-sm"
          autoFocus
        />
      ) : (
        <span
          className={cn(
            "flex-1 cursor-pointer text-sm leading-relaxed",
            todo.done ? "line-through text-muted-foreground" : "text-foreground",
          )}
          onDoubleClick={() => { setEditing(true); setVal(todo.text) }}
          title="Double-click to edit"
        >
          {todo.text}
        </span>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
        aria-label="Delete todo"
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
      </button>
    </li>
  )
}

/* ─── Add todo inline ─── */

function AddTodoInline({ onAdd }: { onAdd: (text: string) => void }) {
  const [val, setVal] = useState("")
  const submit = () => {
    if (!val.trim()) return
    onAdd(val.trim())
    setVal("")
  }
  return (
    <div className="flex items-center gap-2 border-t border-border px-4 py-2.5">
      <Plus className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit() }}
        placeholder="Add a task…"
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        aria-label="New todo"
      />
      {val.trim() && (
        <button
          type="button"
          onClick={submit}
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          Add
        </button>
      )}
    </div>
  )
}

/* ─── Meeting card ─── */

function MeetingCard({ meeting, todos }: { meeting: Meeting; todos: Todo[] }) {
  const { deleteMeeting, addTodo, toggleTodo, updateTodo, deleteTodo, updateMeeting } = useStore()
  const [expanded, setExpanded] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [toDelete, setToDelete] = useState(false)

  const doneTodos = todos.filter((t) => t.done).length

  const confirmDelete = () => {
    deleteMeeting(meeting.id)
    toast.success("Meeting deleted.")
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Header row */}
        <div className="flex items-start gap-3 px-5 py-4">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronDown className="size-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="size-4" aria-hidden="true" />
            )}
          </button>

          <div className="min-w-0 flex-1" onClick={() => setExpanded((v) => !v)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}>
            <div className="flex items-center gap-2">
              <p className="truncate font-medium text-foreground">{meeting.title}</p>
              {todos.length > 0 && (
                <Badge variant="secondary" className={cn(
                  "text-xs",
                  doneTodos === todos.length
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}>
                  {doneTodos}/{todos.length}
                </Badge>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3" aria-hidden="true" />
              {formatDate(meeting.date)}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="Meeting actions">
                <MoreHorizontal className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFormOpen(true)}>
                <Pencil className="size-4" aria-hidden="true" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setToDelete(true)} className="text-destructive focus:text-destructive">
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Expanded body */}
        {expanded && (
          <div className="border-t border-border">
            {meeting.description && (
              <div className="px-5 py-3">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{meeting.description}</p>
              </div>
            )}

            {/* Todos */}
            <div className={meeting.description ? "border-t border-border" : ""}>
              {todos.length > 0 && (
                <ul className="divide-y divide-border/60">
                  {todos.map((t) => (
                    <TodoRow
                      key={t.id}
                      todo={t}
                      onToggle={() => toggleTodo(t.id)}
                      onDelete={() => { deleteTodo(t.id); toast.success("Task removed.") }}
                      onEdit={(text) => updateTodo(t.id, text)}
                    />
                  ))}
                </ul>
              )}
              <AddTodoInline onAdd={(text) => addTodo(text, meeting.id)} />
            </div>
          </div>
        )}
      </div>

      <MeetingFormDialog open={formOpen} onOpenChange={setFormOpen} meeting={meeting} />

      <Dialog open={toDelete} onOpenChange={setToDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete meeting</DialogTitle>
            <DialogDescription>
              Delete &ldquo;{meeting.title}&rdquo; and all its tasks? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ─── Page ─── */

export default function MeetingsPage() {
  const { data, addTodo, toggleTodo, updateTodo, deleteTodo } = useStore()
  const [formOpen, setFormOpen] = useState(false)
  const [search, setSearch] = useState("")

  const sortedMeetings = useMemo(
    () => [...data.meetings].sort((a, b) => b.date.localeCompare(a.date)),
    [data.meetings],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sortedMeetings
    return sortedMeetings.filter(
      (m) => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q),
    )
  }, [sortedMeetings, search])

  const globalTodos = useMemo(
    () => data.todos.filter((t) => !t.meetingId),
    [data.todos],
  )
  const globalDone = globalTodos.filter((t) => t.done).length

  const todosByMeeting = useMemo(() => {
    const map = new Map<string, Todo[]>()
    for (const t of data.todos) {
      if (t.meetingId) {
        const arr = map.get(t.meetingId) ?? []
        arr.push(t)
        map.set(t.meetingId, arr)
      }
    }
    return map
  }, [data.todos])

  const totalMeetings = data.meetings.length
  const totalTodos = data.todos.length
  const doneTodos = data.todos.filter((t) => t.done).length

  return (
    <div className="flex flex-col">
      <PageHeader title="Minutes & Meetings" description="Track meeting records, notes, and action items.">
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="size-4" aria-hidden="true" />
          New meeting
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-semibold leading-none">{totalMeetings}</p>
              <p className="mt-1 text-xs text-muted-foreground">Meetings</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckSquare2 className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-semibold leading-none">{doneTodos}/{totalTodos}</p>
              <p className="mt-1 text-xs text-muted-foreground">Tasks done</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Square className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-semibold leading-none">{globalTodos.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">General tasks</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Meetings list */}
          <div className="flex flex-col gap-4 xl:col-span-2">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search meetings…"
                  className="pl-3"
                  aria-label="Search meetings"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-16 text-center">
                <CalendarDays className="size-8 text-muted-foreground/40" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  {data.meetings.length === 0
                    ? "No meetings yet. Create your first meeting record."
                    : "No meetings match your search."}
                </p>
                {data.meetings.length === 0 && (
                  <Button size="sm" onClick={() => setFormOpen(true)} className="gap-2 mt-1">
                    <Plus className="size-4" aria-hidden="true" />
                    New meeting
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((m) => (
                  <MeetingCard
                    key={m.id}
                    meeting={m}
                    todos={todosByMeeting.get(m.id) ?? []}
                  />
                ))}
              </div>
            )}
          </div>

          {/* General to-do list */}
          <div className="flex flex-col">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">General tasks</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Not linked to any meeting</p>
                </div>
                {globalTodos.length > 0 && (
                  <Badge variant="secondary" className={cn(
                    "text-xs",
                    globalDone === globalTodos.length
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {globalDone}/{globalTodos.length}
                  </Badge>
                )}
              </div>

              {globalTodos.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No general tasks yet.
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {globalTodos.map((t) => (
                    <TodoRow
                      key={t.id}
                      todo={t}
                      onToggle={() => toggleTodo(t.id)}
                      onDelete={() => { deleteTodo(t.id); toast.success("Task removed.") }}
                      onEdit={(text) => updateTodo(t.id, text)}
                    />
                  ))}
                </ul>
              )}
              <AddTodoInline onAdd={(text) => addTodo(text)} />
            </div>
          </div>
        </div>
      </div>

      <MeetingFormDialog open={formOpen} onOpenChange={setFormOpen} meeting={null} />
    </div>
  )
}
