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
import { generateSchedule } from "./scheduler"
import { buildSeed } from "./seed"

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
  // data management
  importData: (payload: ImportPayload) => { students: number; classes: number; lessons: number }
  exportData: () => AppData
  loadSeed: () => void
  resetAll: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData)
  const [ready, setReady] = useState(false)
  const hydrated = useRef(false)

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
      mutateAndRegenerate((prev) => ({
        ...prev,
        students: [...prev.students, { ...s, id: uid("st") }],
      }))
    },
    [mutateAndRegenerate],
  )

  const updateStudent = useCallback(
    (id: string, s: Partial<Student>) => {
      mutateAndRegenerate((prev) => ({
        ...prev,
        students: prev.students.map((x) => (x.id === id ? { ...x, ...s } : x)),
      }))
    },
    [mutateAndRegenerate],
  )

  const deleteStudent = useCallback(
    (id: string) => {
      mutateAndRegenerate((prev) => ({
        ...prev,
        students: prev.students.filter((x) => x.id !== id),
      }))
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

  const exportData = useCallback(() => data, [data])

  const loadSeed = useCallback(() => {
    setData(buildSeed())
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
      addMeeting,
      updateMeeting,
      deleteMeeting,
      addTodo,
      toggleTodo,
      updateTodo,
      deleteTodo,
      importData,
      exportData,
      loadSeed,
      resetAll,
    }),
    [
      data, ready,
      addPromotion, updatePromotion, deletePromotion, regenerate,
      addStudent, updateStudent, deleteStudent,
      updateEvent,
      addMeeting, updateMeeting, deleteMeeting,
      addTodo, toggleTodo, updateTodo, deleteTodo,
      importData, exportData, loadSeed, resetAll,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
