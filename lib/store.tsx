"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { AppData, BibleClass, CalendarEvent, ImportPayload, Lesson, Meeting, Promotion, Student, Todo } from "./types"
import { generateSchedule, nextLessonDay } from "./scheduler"
import { getClassTemplate } from "./seed"
import { toast } from "sonner"
import {
  supabase,
  rowToPromotion, promotionToRow,
  rowToStudent,   studentToRow, partialStudentToRow,
  rowToClass,     classToRow,
  rowToLesson,    lessonToRow,
  rowToEvent,     eventToRow,
  rowToMeeting,   meetingToRow,
  rowToTodo,      todoToRow,
  upsertEvents, replacePromoEvents, replaceAllEvents,
} from "./supabase"

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

function emptyData(): AppData {
  return { settings: { promotions: [] }, students: [], classes: [], lessons: [], events: [], meetings: [], todos: [] }
}

interface StoreValue {
  data: AppData
  ready: boolean
  addPromotion: (p: Omit<Promotion, "id">) => Promise<string>
  updatePromotion: (id: string, next: Partial<Promotion>) => void
  deletePromotion: (id: string) => void
  regenerate: () => void
  addStudent: (s: Omit<Student, "id">) => void
  updateStudent: (id: string, s: Partial<Student>) => void
  deleteStudent: (id: string) => void
  updateEvent: (id: string, next: Partial<CalendarEvent>) => void
  addMeeting: (m: Omit<Meeting, "id" | "createdAt">) => string
  updateMeeting: (id: string, next: Partial<Meeting>) => void
  deleteMeeting: (id: string) => void
  addTodo: (text: string, meetingId?: string) => void
  toggleTodo: (id: string) => void
  updateTodo: (id: string, text: string) => void
  deleteTodo: (id: string) => void
  repairFellowships: (promotionId: string) => void
  shiftEventsAfter: (promotionId: string, fromDate: string, deltaDays: number) => void
  extendScheduleDay: (promotionId: string, fromDate: string) => void
  markLessonDone: (id: string) => void
  postponeLesson: (id: string) => void
  importData: (payload: ImportPayload) => { students: number; classes: number; lessons: number }
  importStudentsForPromotion: (promoId: string, students: ImportPayload["students"]) => Promise<number>
  exportData: () => AppData
  loadSeed: () => void
  loadClassTemplate: () => void
  resetAll: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setDataState] = useState<AppData>(emptyData)
  const [ready, setReady]    = useState(false)
  const dataRef              = useRef<AppData>(emptyData())

  // Single setter that keeps ref in sync
  const setData = useCallback((next: AppData) => {
    dataRef.current = next
    setDataState(next)
  }, [])

  /* ── Load everything from Supabase on mount ── */

  useEffect(() => {
    async function loadAll() {
      try {
        const [promos, students, classes, lessons, events, meetings, todos] = await Promise.all([
          supabase.from("promotions").select("*"),
          supabase.from("students").select("*"),
          supabase.from("classes").select("*").order("order"),
          supabase.from("lessons").select("*").order("order"),
          supabase.from("events").select("*"),
          supabase.from("meetings").select("*").order("created_at", { ascending: false }),
          supabase.from("todos").select("*"),
        ])

        setData({
          settings: { promotions: (promos.data   ?? []).map(rowToPromotion) },
          students:              (students.data  ?? []).map(rowToStudent),
          classes:               (classes.data   ?? []).map(rowToClass),
          lessons:               (lessons.data   ?? []).map(rowToLesson),
          events:                (events.data    ?? []).map(rowToEvent),
          meetings:              (meetings.data  ?? []).map(rowToMeeting),
          todos:                 (todos.data     ?? []).map(rowToTodo),
        })
      } catch {
        toast.error("Could not load data from database.")
      } finally {
        setReady(true)
      }
    }
    loadAll()
  }, [setData])

  /* ── Promotions ── */

  const addPromotion = useCallback(async (p: Omit<Promotion, "id">) => {
    const id        = uid("promo")
    const promotion = { ...p, id }
    const prev      = dataRef.current
    const next      = { ...prev, settings: { promotions: [...prev.settings.promotions, promotion] } }
    const withEvts  = { ...next, events: generateSchedule(next) }
    setData(withEvts)

    const { error } = await supabase.from("promotions").insert(promotionToRow(promotion))
    if (error) {
      toast.error("Failed to save promotion.")
      throw error
    }

    const promoEvts = withEvts.events.filter((e) => e.promotionId === id)
    if (promoEvts.length) {
      try {
        await upsertEvents(promoEvts)
      } catch {
        toast.error("Failed to sync events.")
      }
    }
    return id
  }, [setData])

  const updatePromotion = useCallback((id: string, patch: Partial<Promotion>) => {
    const prev   = dataRef.current
    const promos = prev.settings.promotions.map((p) => (p.id === id ? { ...p, ...patch } : p))
    const next   = { ...prev, settings: { promotions: promos } }
    const withEvts = { ...next, events: generateSchedule(next) }
    setData(withEvts)

    const updated = promos.find((p) => p.id === id)!
    supabase.from("promotions").update(promotionToRow(updated)).eq("id", id)
      .then(({ error }) => { if (error) toast.error("Failed to update promotion.") })
    replacePromoEvents(id, withEvts.events).catch(() => toast.error("Failed to sync events."))
  }, [setData])

  const deletePromotion = useCallback((id: string) => {
    const prev = dataRef.current
    const studentsToDelete = prev.students.filter((s) => s.promotionId === id)
    const studentIds = studentsToDelete.map((s) => s.id)

    setData({
      ...prev,
      settings: { promotions: prev.settings.promotions.filter((p) => p.id !== id) },
      students:  prev.students.filter((s) => s.promotionId !== id),
      events:    prev.events.filter((e) => e.promotionId !== id && (!e.studentId || !studentIds.includes(e.studentId))),
    })

    // Delete birthday events of these students first, then other events of the promotion, then students, then promotion
    let deletePromise: PromiseLike<unknown> = supabase.from("events").delete().eq("promotion_id", id)
    if (studentIds.length > 0) {
      deletePromise = deletePromise.then(() =>
        supabase.from("events").delete().in("student_id", studentIds)
      )
    }

    deletePromise
      .then(() => supabase.from("students").delete().eq("promotion_id", id))
      .then(() => supabase.from("promotions").delete().eq("id", id))
      .then(({ error }) => { if (error) toast.error("Failed to delete promotion in database: " + error.message) })
  }, [setData])

  const regenerate = useCallback(() => {
    const prev    = dataRef.current
    const withEvts = { ...prev, events: generateSchedule(prev) }
    setData(withEvts)
    replaceAllEvents(withEvts.events).catch(() => toast.error("Failed to sync events."))
  }, [setData])

  /* ── Students ── */

  const addStudent = useCallback((s: Omit<Student, "id">) => {
    const student  = { ...s, id: uid("st") } as Student
    const prev     = dataRef.current
    const next     = { ...prev, students: [...prev.students, student] }
    const withEvts = { ...next, events: generateSchedule(next) }
    setData(withEvts)

    supabase.from("students").insert(studentToRow(student))
      .then(({ error }) => { if (error) toast.error("Failed to save student.") })
    const birthdays = withEvts.events.filter((e) => e.type === "birthday" && e.studentId === student.id)
    if (birthdays.length) upsertEvents(birthdays).catch(() => {})
  }, [setData])

  const updateStudent = useCallback((id: string, s: Partial<Student>) => {
    const prev     = dataRef.current
    const next     = { ...prev, students: prev.students.map((x) => (x.id === id ? { ...x, ...s } : x)) }
    const withEvts = { ...next, events: generateSchedule(next) }
    setData(withEvts)

    supabase.from("students").update(partialStudentToRow(s)).eq("id", id)
      .then(({ error }) => { if (error) toast.error("Failed to update student.") })
    if (s.birthday !== undefined) {
      const birthdays = withEvts.events.filter((e) => e.type === "birthday" && e.studentId === id)
      supabase.from("events").delete().eq("student_id", id).then(() => {
        if (birthdays.length) upsertEvents(birthdays).catch(() => {})
      })
    }
  }, [setData])

  const deleteStudent = useCallback((id: string) => {
    const prev     = dataRef.current
    const next     = { ...prev, students: prev.students.filter((x) => x.id !== id) }
    const withEvts = { ...next, events: generateSchedule(next) }
    setData(withEvts)

    // Delete child events first (e.g. birthdays), then delete student
    supabase.from("events").delete().eq("student_id", id)
      .then(() => supabase.from("students").delete().eq("id", id))
      .then(({ error }) => { if (error) toast.error("Failed to delete student in database: " + error.message) })
  }, [setData])

  /* ── Events ── */

  const updateEvent = useCallback((id: string, patch: Partial<CalendarEvent>) => {
    const prev    = dataRef.current
    const events  = prev.events.map((e) => (e.id === id ? { ...e, ...patch, edited: true } : e))
    setData({ ...prev, events })
    const updated = events.find((e) => e.id === id)
    if (updated) supabase.from("events").upsert(eventToRow(updated))
      .then(({ error }) => { if (error) toast.error("Failed to update event.") })
  }, [setData])

  const markLessonDone = useCallback((id: string) => {
    const prev   = dataRef.current
    const events = prev.events.map((e) => (e.id === id ? { ...e, status: "done" as const, edited: true } : e))
    setData({ ...prev, events })
    const updated = events.find((e) => e.id === id)
    if (updated) supabase.from("events").upsert(eventToRow(updated))
  }, [setData])

  const postponeLesson = useCallback((id: string) => {
    const prev  = dataRef.current
    const event = prev.events.find((e) => e.id === id)
    if (!event?.promotionId) return

    const sorted   = prev.events
      .filter((e) => e.promotionId === event.promotionId && e.type === "lesson")
      .sort((a, b) => a.date.localeCompare(b.date))
    const startIdx = sorted.findIndex((e) => e.id === id)
    if (startIdx < 0) return

    const newDates = new Map<string, string>()
    let prevDate   = sorted[startIdx].date
    for (let i = startIdx; i < sorted.length; i++) {
      const next = nextLessonDay(prevDate)
      newDates.set(sorted[i].id, next)
      prevDate = next
    }

    const events = prev.events.map((e) => {
      const d = newDates.get(e.id)
      return d ? { ...e, date: d, edited: true } : e
    })
    setData({ ...prev, events })
    const changed = events.filter((e) => newDates.has(e.id))
    upsertEvents(changed).catch(() => toast.error("Failed to sync postponed lessons."))
  }, [setData])

  const shiftEventsAfter = useCallback((promotionId: string, fromDate: string, deltaDays: number) => {
    if (!deltaDays) return
    const prev   = dataRef.current
    const events = prev.events.map((e) => {
      if (e.promotionId !== promotionId || e.date <= fromDate) return e
      const d = new Date(e.date + "T00:00:00")
      d.setDate(d.getDate() + deltaDays)
      return { ...e, date: d.toISOString().slice(0, 10), edited: true }
    })
    setData({ ...prev, events })
    const changed = events.filter((e) => e.promotionId === promotionId && e.date > fromDate)
    upsertEvents(changed).catch(() => {})
  }, [setData])

  const extendScheduleDay = useCallback((promotionId: string, fromDate: string) => {
    const prev       = dataRef.current
    const prevLesson = [...prev.events]
      .filter((e) => e.promotionId === promotionId && e.type === "lesson" && e.date < fromDate)
      .sort((a, b) => b.date.localeCompare(a.date))[0]

    const shifted = prev.events.map((e) => {
      if (e.promotionId !== promotionId || e.date < fromDate) return e
      const d = new Date(e.date + "T00:00:00")
      d.setDate(d.getDate() + 1)
      return { ...e, date: d.toISOString().slice(0, 10), edited: true }
    })

    if (!prevLesson) {
      setData({ ...prev, events: shifted })
      upsertEvents(shifted.filter((e) => e.promotionId === promotionId && e.edited)).catch(() => {})
      return
    }

    const repeat: CalendarEvent = {
      id: uid("ev"), date: fromDate, type: "lesson",
      title: prevLesson.title, description: prevLesson.description ?? "",
      reference: prevLesson.reference, lessonId: prevLesson.lessonId,
      classId: prevLesson.classId, promotionId, edited: true,
    }
    const events = [...shifted, repeat]
    setData({ ...prev, events })
    upsertEvents([...shifted.filter((e) => e.promotionId === promotionId && e.edited), repeat]).catch(() => {})
  }, [setData])

  const repairFellowships = useCallback((promotionId: string) => {
    const prev    = dataRef.current
    const lessons = prev.events.filter((e) => e.promotionId === promotionId && e.type === "lesson")
    if (!lessons.length) return

    const dates = lessons.map((e) => e.date).sort()
    const start = new Date(dates[0] + "T00:00:00")
    const end   = new Date(dates[dates.length - 1] + "T00:00:00")
    end.setDate(end.getDate() + 14)

    const correct: CalendarEvent[] = []
    const d = new Date(start)
    while (d.getDay() !== 0) d.setDate(d.getDate() - 1)
    while (d <= end) {
      const iso = d.toISOString().slice(0, 10)
      correct.push({ id: `${promotionId}-fellowship-${iso}`, date: iso, type: "fellowship", title: "Sunday Fellowship", description: "Weekly fellowship gathering.", promotionId })
      d.setDate(d.getDate() + 7)
    }

    setData({
      ...prev,
      events: [...prev.events.filter((e) => !(e.promotionId === promotionId && e.type === "fellowship")), ...correct],
    })
    supabase.from("events").delete().eq("promotion_id", promotionId).eq("type", "fellowship").then(() => {
      upsertEvents(correct).catch(() => {})
    })
  }, [setData])

  /* ── Meetings ── */

  const addMeeting = useCallback((m: Omit<Meeting, "id" | "createdAt">) => {
    const id      = uid("mt")
    const meeting = { ...m, id, createdAt: new Date().toISOString() }
    const prev    = dataRef.current
    setData({ ...prev, meetings: [meeting, ...prev.meetings] })
    supabase.from("meetings").insert(meetingToRow(meeting))
      .then(({ error }) => { if (error) toast.error("Failed to save meeting.") })
    return id
  }, [setData])

  const updateMeeting = useCallback((id: string, patch: Partial<Meeting>) => {
    const prev = dataRef.current
    setData({ ...prev, meetings: prev.meetings.map((x) => (x.id === id ? { ...x, ...patch } : x)) })
    supabase.from("meetings").update(patch).eq("id", id)
      .then(({ error }) => { if (error) toast.error("Failed to update meeting.") })
  }, [setData])

  const deleteMeeting = useCallback((id: string) => {
    const prev = dataRef.current
    setData({ ...prev, meetings: prev.meetings.filter((x) => x.id !== id), todos: prev.todos.filter((t) => t.meetingId !== id) })
    supabase.from("meetings").delete().eq("id", id) // todos cascade-deleted by Supabase FK
      .then(({ error }) => { if (error) toast.error("Failed to delete meeting in database: " + error.message) })
  }, [setData])

  /* ── Todos ── */

  const addTodo = useCallback((text: string, meetingId?: string) => {
    const todo = { id: uid("td"), text, done: false, createdAt: new Date().toISOString(), meetingId } as Todo
    const prev = dataRef.current
    setData({ ...prev, todos: [...prev.todos, todo] })
    supabase.from("todos").insert(todoToRow(todo))
      .then(({ error }) => { if (error) toast.error("Failed to save todo.") })
  }, [setData])

  const toggleTodo = useCallback((id: string) => {
    const prev  = dataRef.current
    const todos = prev.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    setData({ ...prev, todos })
    const updated = todos.find((t) => t.id === id)
    if (updated) supabase.from("todos").update({ done: updated.done }).eq("id", id)
  }, [setData])

  const updateTodo = useCallback((id: string, text: string) => {
    const prev = dataRef.current
    setData({ ...prev, todos: prev.todos.map((t) => (t.id === id ? { ...t, text } : t)) })
    supabase.from("todos").update({ text }).eq("id", id)
  }, [setData])

  const deleteTodo = useCallback((id: string) => {
    const prev = dataRef.current
    setData({ ...prev, todos: prev.todos.filter((t) => t.id !== id) })
    supabase.from("todos").delete().eq("id", id)
      .then(({ error }) => { if (error) toast.error("Failed to delete todo in database: " + error.message) })
  }, [setData])

  /* ── Data management ── */

  const importData = useCallback((payload: ImportPayload) => {
    const counts  = { students: 0, classes: 0, lessons: 0 }
    const prev    = dataRef.current
    const classes  = (payload.classes  ?? prev.classes)  as BibleClass[]
    const lessons  = (payload.lessons  ?? prev.lessons)  as Lesson[]
    const students = payload.students
      ? payload.students.map((s) => ({ id: s.id ?? uid("st"), firstName: s.firstName ?? "", lastName: s.lastName ?? "", email: s.email ?? "", phone: s.phone ?? "", birthday: s.birthday ?? "", classId: s.classId ?? "", promotionId: s.promotionId ?? "", status: s.status ?? "active", notes: s.notes ?? "" } as Student))
      : prev.students

    counts.students = students.length
    counts.classes  = classes.length
    counts.lessons  = lessons.length

    const next     = { ...prev, classes, lessons, students }
    const withEvts = { ...next, events: generateSchedule(next) }
    setData(withEvts)

    if (payload.classes)  supabase.from("classes").upsert(classes.map(classToRow))
    if (payload.lessons)  supabase.from("lessons").upsert(lessons.map(lessonToRow))
    if (payload.students) supabase.from("students").upsert(students.map(studentToRow))
    replaceAllEvents(withEvts.events).catch(() => {})
    return counts
  }, [setData])

  const importStudentsForPromotion = useCallback(async (promoId: string, rows: ImportPayload["students"]) => {
    if (!rows?.length) return 0
    const newStudents: Student[] = rows.map((s) => ({ id: s.id ?? uid("st"), firstName: s.firstName ?? "", lastName: s.lastName ?? "", email: s.email ?? "", phone: s.phone ?? "", birthday: s.birthday ?? "", classId: s.classId ?? "", promotionId: promoId, status: s.status ?? "active", notes: s.notes ?? "" }))
    const prev     = dataRef.current
    const next     = { ...prev, students: [...prev.students, ...newStudents] }
    const withEvts = { ...next, events: generateSchedule(next) }
    setData(withEvts)

    const { error } = await supabase.from("students").upsert(newStudents.map(studentToRow))
    if (error) {
      toast.error("Failed to import students to database: " + error.message)
      throw error
    }

    const birthdays = withEvts.events.filter((e) => e.type === "birthday" && newStudents.some((s) => s.id === e.studentId))
    if (birthdays.length) {
      try {
        await upsertEvents(birthdays)
      } catch {
        // failed to sync birthdays, but continue
      }
    }
    return rows.length
  }, [setData])

  const exportData     = useCallback(() => dataRef.current, [])
  const loadSeed       = useCallback(() => setData(emptyData()), [setData])

  const loadClassTemplate = useCallback(() => {
    const { classes, lessons } = getClassTemplate()
    const prev     = dataRef.current
    const next     = { ...prev, classes, lessons }
    const withEvts = { ...next, events: generateSchedule(next) }
    setData(withEvts)
    supabase.from("classes").upsert(classes.map(classToRow))
    supabase.from("lessons").upsert(lessons.map(lessonToRow))
    replaceAllEvents(withEvts.events).catch(() => {})
  }, [setData])

  const resetAll = useCallback(() => {
    setData(emptyData())
    Promise.all([
      supabase.from("promotions").delete().not("id", "is", null),
      supabase.from("students").delete().not("id", "is", null),
      supabase.from("classes").delete().not("id", "is", null),
      supabase.from("lessons").delete().not("id", "is", null),
      supabase.from("events").delete().not("id", "is", null),
      supabase.from("meetings").delete().not("id", "is", null),
      supabase.from("todos").delete().not("id", "is", null),
    ]).catch(() => toast.error("Failed to clear database."))
  }, [setData])

  const value = useMemo<StoreValue>(
    () => ({
      data, ready,
      addPromotion, updatePromotion, deletePromotion, regenerate,
      addStudent, updateStudent, deleteStudent,
      updateEvent, repairFellowships, shiftEventsAfter, extendScheduleDay, markLessonDone, postponeLesson,
      addMeeting, updateMeeting, deleteMeeting,
      addTodo, toggleTodo, updateTodo, deleteTodo,
      importData, importStudentsForPromotion, exportData, loadSeed, loadClassTemplate, resetAll,
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
