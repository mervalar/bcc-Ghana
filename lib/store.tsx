"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type {
  AppData,
  CalendarEvent,
  ImportPayload,
  Meeting,
  Promotion,
  Student,
} from "./types"
import { generateSchedule, nextLessonDay } from "./scheduler"
import { buildSeed, getClassTemplate } from "./seed"
import { supabase, rowToStudent, studentToRow, partialStudentToRow } from "./supabase"
import { toast } from "sonner"

const STORAGE_KEY = "bsm:data"

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

function defaultPromotion(): Promotion {
  return { id: "promo-default", name: "Promotion 2026–2027", scheduleStartDate: "2026-09-04" }
}

function emptyData(): AppData {
  return {
    settings: { promotions: [defaultPromotion()] },
    students: [],
    classes: [],
    lessons: [],
    events: [],
    meetings: [],
    todos: [],
  }
}

/** Migrate localStorage data from old single-promotion format to multi-promotion format. */
function migrate(raw: unknown): AppData {
  const parsed = raw as AppData & {
    settings: AppData["settings"] & { promotionName?: string; scheduleStartDate?: string }
  }
  const base = { ...emptyData(), ...parsed }

  // Old format had settings.promotionName — convert to promotions array
  const s = parsed.settings as { promotionName?: string; scheduleStartDate?: string; promotions?: Promotion[] }
  if (!s.promotions) {
    const legacyPromo: Promotion = {
      id: "promo-default",
      name: s.promotionName ?? "Promotion 2026–2027",
      scheduleStartDate: s.scheduleStartDate ?? "2026-09-04",
    }
    base.settings = { promotions: [legacyPromo] }
    // Tag existing non-birthday events with the default promotionId
    base.events = (parsed.events ?? []).map((e) =>
      e.type === "birthday" || e.promotionId ? e : { ...e, promotionId: "promo-default" },
    )
  }

  return base
}

interface StoreValue {
  data: AppData
  ready: boolean
  // promotions
  addPromotion: (p: Omit<Promotion, "id">) => string
  updatePromotion: (id: string, next: Partial<Promotion>) => void
  deletePromotion: (id: string) => void
  regenerate: () => void
  // students
  addStudent: (s: Omit<Student, "id">) => void
  updateStudent: (id: string, s: Partial<Student>) => void
  deleteStudent: (id: string) => void
  // events
  updateEvent: (id: string, next: Partial<CalendarEvent>) => void
  // meetings
  addMeeting: (m: Omit<Meeting, "id" | "createdAt">) => string
  updateMeeting: (id: string, next: Partial<Meeting>) => void
  deleteMeeting: (id: string) => void
  // todos
  addTodo: (text: string, meetingId?: string) => void
  toggleTodo: (id: string) => void
  updateTodo: (id: string, text: string) => void
  deleteTodo: (id: string) => void
  repairFellowships: (promotionId: string) => void
  shiftEventsAfter: (promotionId: string, fromDate: string, deltaDays: number) => void
  extendScheduleDay: (promotionId: string, fromDate: string) => void
  markLessonDone: (id: string) => void
  postponeLesson: (id: string) => void
  // data management
  importData: (payload: ImportPayload) => { students: number; classes: number; lessons: number }
  importStudentsForPromotion: (promoId: string, students: ImportPayload["students"]) => number
  exportData: () => AppData
  loadSeed: () => void
  loadClassTemplate: () => void
  resetAll: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData)
  const [ready, setReady] = useState(false)
  const hydrated = useRef(false)

  // 1. Load non-student data from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setData(migrate(parsed))
      }
    } catch {
      // ignore
    }
    hydrated.current = true
    setReady(true)
  }, [])

  // 2. Sync students with Supabase after localStorage hydration
  useEffect(() => {
    if (!ready) return
    supabase.from("students").select("*").then(({ data: rows, error }) => {
      if (error) { toast.error("Could not load students from database."); return }
      const remote = (rows ?? []).map(rowToStudent)
      if (remote.length > 0) {
        // Supabase is the source of truth — use it
        setData((prev) => ({ ...prev, students: remote }))
      } else {
        // Supabase empty — migrate any existing localStorage students up
        setData((prev) => {
          if (prev.students.length > 0) {
            supabase.from("students").upsert(prev.students.map(studentToRow))
          }
          return prev
        })
      }
    })
  }, [ready])

  useEffect(() => {
    if (!hydrated.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // ignore
    }
  }, [data])

  const mutateAndRegenerate = useCallback((producer: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = producer(prev)
      return { ...next, events: generateSchedule(next) }
    })
  }, [])

  /* ── Promotions ── */

  const addPromotion = useCallback(
    (p: Omit<Promotion, "id">) => {
      const id = uid("promo")
      mutateAndRegenerate((prev) => ({
        ...prev,
        settings: { promotions: [...prev.settings.promotions, { ...p, id }] },
      }))
      return id
    },
    [mutateAndRegenerate],
  )

  const updatePromotion = useCallback(
    (id: string, next: Partial<Promotion>) => {
      mutateAndRegenerate((prev) => ({
        ...prev,
        settings: {
          promotions: prev.settings.promotions.map((p) => (p.id === id ? { ...p, ...next } : p)),
        },
      }))
    },
    [mutateAndRegenerate],
  )

  const deletePromotion = useCallback(
    (id: string) => {
      mutateAndRegenerate((prev) => ({
        ...prev,
        settings: { promotions: prev.settings.promotions.filter((p) => p.id !== id) },
        students: prev.students.filter((s) => s.promotionId !== id),
        events: prev.events.filter((e) => e.promotionId !== id),
      }))
    },
    [mutateAndRegenerate],
  )

  const regenerate = useCallback(() => {
    setData((prev) => ({ ...prev, events: generateSchedule(prev) }))
  }, [])

  /* ── Students ── */

  const addStudent = useCallback(
    (s: Omit<Student, "id">) => {
      const student: Student = { ...s, id: uid("st") }
      mutateAndRegenerate((prev) => ({ ...prev, students: [...prev.students, student] }))
      supabase.from("students").insert(studentToRow(student))
        .then(({ error }) => { if (error) toast.error("Failed to save student to database.") })
    },
    [mutateAndRegenerate],
  )

  const updateStudent = useCallback(
    (id: string, s: Partial<Student>) => {
      mutateAndRegenerate((prev) => ({
        ...prev,
        students: prev.students.map((x) => (x.id === id ? { ...x, ...s } : x)),
      }))
      supabase.from("students").update(partialStudentToRow(s)).eq("id", id)
        .then(({ error }) => { if (error) toast.error("Failed to update student in database.") })
    },
    [mutateAndRegenerate],
  )

  const deleteStudent = useCallback(
    (id: string) => {
      mutateAndRegenerate((prev) => ({ ...prev, students: prev.students.filter((x) => x.id !== id) }))
      supabase.from("students").delete().eq("id", id)
        .then(({ error }) => { if (error) toast.error("Failed to delete student from database.") })
    },
    [mutateAndRegenerate],
  )

  /* ── Events ── */

  const updateEvent = useCallback((id: string, next: Partial<CalendarEvent>) => {
    setData((prev) => ({
      ...prev,
      events: prev.events.map((e) => (e.id === id ? { ...e, ...next, edited: true } : e)),
    }))
  }, [])

  const shiftEventsAfter = useCallback((promotionId: string, fromDate: string, deltaDays: number) => {
    if (!deltaDays) return
    setData((prev) => ({
      ...prev,
      events: prev.events.map((e) => {
        if (e.promotionId !== promotionId || e.date <= fromDate) return e
        const d = new Date(e.date + "T00:00:00")
        d.setDate(d.getDate() + deltaDays)
        return { ...e, date: d.toISOString().slice(0, 10), edited: true }
      }),
    }))
  }, [])

  const markLessonDone = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      events: prev.events.map((e) => e.id === id ? { ...e, status: "done" as const, edited: true } : e),
    }))
  }, [])

  const postponeLesson = useCallback((id: string) => {
    setData((prev) => {
      const event = prev.events.find((e) => e.id === id)
      if (!event?.promotionId) return prev

      // Sort all lessons for this promotion by current date
      const sorted = prev.events
        .filter((e) => e.promotionId === event.promotionId && e.type === "lesson")
        .sort((a, b) => a.date.localeCompare(b.date))

      const startIdx = sorted.findIndex((e) => e.id === id)
      if (startIdx < 0) return prev

      // Cascade: each lesson from startIdx onwards takes nextLessonDay of the
      // PREVIOUS lesson's new date — no collisions, Fri/Sat pattern guaranteed.
      // Fellowships, crusades, and birthdays are never touched.
      const newDates = new Map<string, string>()
      let prevDate = sorted[startIdx].date
      for (let i = startIdx; i < sorted.length; i++) {
        const next = nextLessonDay(prevDate)
        newDates.set(sorted[i].id, next)
        prevDate = next
      }

      return {
        ...prev,
        events: prev.events.map((e) => {
          const d = newDates.get(e.id)
          if (!d) return e
          return { ...e, date: d, edited: true }
        }),
      }
    })
  }, [])

  const extendScheduleDay = useCallback((promotionId: string, fromDate: string) => {
    setData((prev) => {
      // Find the most recent lesson for this promotion before fromDate
      const prevLesson = [...prev.events]
        .filter((e) => e.promotionId === promotionId && e.type === "lesson" && e.date < fromDate)
        .sort((a, b) => b.date.localeCompare(a.date))[0]

      // Shift all events from fromDate onwards (inclusive) by +1 day
      const shifted = prev.events.map((e) => {
        if (e.promotionId !== promotionId || e.date < fromDate) return e
        const d = new Date(e.date + "T00:00:00")
        d.setDate(d.getDate() + 1)
        return { ...e, date: d.toISOString().slice(0, 10), edited: true }
      })

      if (!prevLesson) return { ...prev, events: shifted }

      // Insert a repeat of the previous lesson at fromDate
      const repeat: CalendarEvent = {
        id: uid("ev"),
        date: fromDate,
        type: "lesson",
        title: prevLesson.title,
        description: prevLesson.description ?? "",
        reference: prevLesson.reference,
        lessonId: prevLesson.lessonId,
        classId: prevLesson.classId,
        promotionId,
        edited: true,
      }

      return { ...prev, events: [...shifted, repeat] }
    })
  }, [])

  /* ── Meetings ── */

  const addMeeting = useCallback((m: Omit<Meeting, "id" | "createdAt">) => {
    const id = uid("mt")
    setData((prev) => ({
      ...prev,
      meetings: [{ ...m, id, createdAt: new Date().toISOString() }, ...prev.meetings],
    }))
    return id
  }, [])

  const updateMeeting = useCallback((id: string, next: Partial<Meeting>) => {
    setData((prev) => ({
      ...prev,
      meetings: prev.meetings.map((x) => (x.id === id ? { ...x, ...next } : x)),
    }))
  }, [])

  const deleteMeeting = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      meetings: prev.meetings.filter((x) => x.id !== id),
      todos: prev.todos.filter((t) => t.meetingId !== id),
    }))
  }, [])

  /* ── Todos ── */

  const addTodo = useCallback((text: string, meetingId?: string) => {
    setData((prev) => ({
      ...prev,
      todos: [
        ...prev.todos,
        { id: uid("td"), text, done: false, createdAt: new Date().toISOString(), meetingId },
      ],
    }))
  }, [])

  const toggleTodo = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }))
  }, [])

  const updateTodo = useCallback((id: string, text: string) => {
    setData((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => (t.id === id ? { ...t, text } : t)),
    }))
  }, [])

  const deleteTodo = useCallback((id: string) => {
    setData((prev) => ({ ...prev, todos: prev.todos.filter((t) => t.id !== id) }))
  }, [])

  /* ── Data management ── */

  const importData = useCallback(
    (payload: ImportPayload) => {
      const counts = { students: 0, classes: 0, lessons: 0 }
      mutateAndRegenerate((prev) => {
        const classes = payload.classes ?? prev.classes
        const lessons = payload.lessons ?? prev.lessons
        const students = payload.students
          ? payload.students.map((s) => ({
              id: s.id ?? uid("st"),
              firstName: s.firstName ?? "",
              lastName: s.lastName ?? "",
              email: s.email ?? "",
              phone: s.phone ?? "",
              birthday: s.birthday ?? "",
              classId: s.classId ?? null,
              promotionId: s.promotionId ?? null,
              status: s.status ?? "active",
              notes: s.notes ?? "",
            }))
          : prev.students
        counts.students = students.length
        counts.classes = classes.length
        counts.lessons = lessons.length
        return { ...prev, classes, lessons, students }
      })
      return counts
    },
    [mutateAndRegenerate],
  )

  const importStudentsForPromotion = useCallback(
    (promoId: string, students: ImportPayload["students"]) => {
      if (!students?.length) return 0
      const newStudents: Student[] = students.map((s) => ({
        id: s.id ?? uid("st"),
        firstName: s.firstName ?? "",
        lastName: s.lastName ?? "",
        email: s.email ?? "",
        phone: s.phone ?? "",
        birthday: s.birthday ?? "",
        classId: s.classId ?? "",
        promotionId: promoId,
        status: s.status ?? "active",
        notes: s.notes ?? "",
      }))
      mutateAndRegenerate((prev) => ({ ...prev, students: [...prev.students, ...newStudents] }))
      supabase.from("students").upsert(newStudents.map(studentToRow))
        .then(({ error }) => { if (error) toast.error("Failed to import students to database.") })
      return students.length
    },
    [mutateAndRegenerate],
  )

  const exportData = useCallback(() => data, [data])

  const loadSeed = useCallback(() => {
    setData(buildSeed())
  }, [])

  const loadClassTemplate = useCallback(() => {
    const { classes, lessons } = getClassTemplate()
    mutateAndRegenerate((prev) => ({ ...prev, classes, lessons }))
  }, [mutateAndRegenerate])

  const repairFellowships = useCallback((promotionId: string) => {
    setData((prev) => {
      // Find the date range from lessons for this promotion
      const lessons = prev.events.filter((e) => e.promotionId === promotionId && e.type === "lesson")
      if (!lessons.length) return prev

      const dates = lessons.map((e) => e.date).sort()
      const start = new Date(dates[0] + "T00:00:00")
      const end = new Date(dates[dates.length - 1] + "T00:00:00")
      end.setDate(end.getDate() + 14)

      // Build correct Sunday fellowship events
      const correct: CalendarEvent[] = []
      const d = new Date(start)
      while (d.getDay() !== 0) d.setDate(d.getDate() - 1) // rewind to prev Sunday
      while (d <= end) {
        const iso = d.toISOString().slice(0, 10)
        correct.push({ id: `${promotionId}-fellowship-${iso}`, date: iso, type: "fellowship", title: "Sunday Fellowship", description: "Weekly fellowship gathering.", promotionId })
        d.setDate(d.getDate() + 7)
      }

      // Remove all fellowship events for this promotion and replace with correct ones
      return {
        ...prev,
        events: [
          ...prev.events.filter((e) => !(e.promotionId === promotionId && e.type === "fellowship")),
          ...correct,
        ],
      }
    })
  }, [])

  const resetAll = useCallback(() => {
    setData(emptyData())
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      data,
      ready,
      addPromotion,
      updatePromotion,
      deletePromotion,
      regenerate,
      addStudent,
      updateStudent,
      deleteStudent,
      updateEvent,
      repairFellowships,
      shiftEventsAfter,
      extendScheduleDay,
      markLessonDone,
      postponeLesson,
      addMeeting,
      updateMeeting,
      deleteMeeting,
      addTodo,
      toggleTodo,
      updateTodo,
      deleteTodo,
      importData,
      importStudentsForPromotion,
      exportData,
      loadSeed,
      loadClassTemplate,
      resetAll,
    }),
    [
      data, ready,
      addPromotion, updatePromotion, deletePromotion, regenerate,
      addStudent, updateStudent, deleteStudent,
      updateEvent, repairFellowships, shiftEventsAfter, extendScheduleDay, markLessonDone, postponeLesson,
      addMeeting, updateMeeting, deleteMeeting,
      addTodo, toggleTodo, updateTodo, deleteTodo,
      importData, importStudentsForPromotion, exportData, loadSeed, loadClassTemplate, resetAll,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
