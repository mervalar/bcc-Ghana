import { createClient } from "@supabase/supabase-js"
import type { BibleClass, CalendarEvent, Lesson, Meeting, Promotion, StaffMember, StaffTeam, Student, Todo } from "./types"

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

/* ── Promotions ── */

export function rowToPromotion(r: Record<string, unknown>): Promotion {
  return {
    id:                  r.id as string,
    name:                r.name as string,
    scheduleStartDate:   r.schedule_start_date as string,
  }
}
export function promotionToRow(p: Promotion) {
  return { id: p.id, name: p.name, schedule_start_date: p.scheduleStartDate }
}

/* ── Students ── */

export function rowToStudent(r: Record<string, unknown>): Student {
  return {
    id:          r.id as string,
    firstName:   r.first_name as string,
    lastName:    r.last_name as string,
    email:       (r.email as string) ?? "",
    phone:       (r.phone as string) ?? "",
    birthday:    (r.birthday as string) ?? "",
    classId:     (r.class_id as string) ?? "",
    promotionId: (r.promotion_id as string) ?? "",
    status:      ((r.status as string) ?? "active") as Student["status"],
    notes:       (r.notes as string) ?? "",
  }
}
export function studentToRow(s: Student) {
  return {
    id:           s.id,
    first_name:   s.firstName,
    last_name:    s.lastName,
    email:        s.email    || null,
    phone:        s.phone    || null,
    birthday:     s.birthday || null,
    class_id:     s.classId  || null,
    promotion_id: s.promotionId || null,
    status:       s.status ?? "active",
    notes:        s.notes   || null,
  }
}
export function partialStudentToRow(s: Partial<Student>) {
  const r: Record<string, unknown> = {}
  if (s.firstName   !== undefined) r.first_name   = s.firstName
  if (s.lastName    !== undefined) r.last_name    = s.lastName
  if (s.email       !== undefined) r.email        = s.email    || null
  if (s.phone       !== undefined) r.phone        = s.phone    || null
  if (s.birthday    !== undefined) r.birthday     = s.birthday || null
  if (s.classId     !== undefined) r.class_id     = s.classId  || null
  if (s.promotionId !== undefined) r.promotion_id = s.promotionId || null
  if (s.status      !== undefined) r.status       = s.status
  if (s.notes       !== undefined) r.notes        = s.notes    || null
  return r
}

/* ── Classes ── */

export function rowToClass(r: Record<string, unknown>): BibleClass {
  return {
    id:          r.id as string,
    name:        r.name as string,
    order:       r.order as number,
    description: (r.description as string) ?? "",
  }
}
export function classToRow(c: BibleClass) {
  return { id: c.id, name: c.name, order: c.order, description: c.description || null }
}

/* ── Lessons ── */

export function rowToLesson(r: Record<string, unknown>): Lesson {
  return {
    id:          r.id as string,
    classId:     r.class_id as string,
    title:       r.title as string,
    order:       r.order as number,
    description: (r.description as string) ?? "",
    reference:   (r.reference as string) ?? "",
  }
}
export function lessonToRow(l: Lesson) {
  return {
    id:          l.id,
    class_id:    l.classId,
    title:       l.title,
    order:       l.order,
    description: l.description || null,
    reference:   l.reference   || null,
  }
}

/* ── Events ── */

export function rowToEvent(r: Record<string, unknown>): CalendarEvent {
  return {
    id:          r.id as string,
    date:        r.date as string,
    type:        r.type as CalendarEvent["type"],
    title:       r.title as string,
    description: (r.description as string) ?? "",
    lessonId:    (r.lesson_id as string)    ?? undefined,
    classId:     (r.class_id as string)     ?? undefined,
    studentId:   (r.student_id as string)   ?? undefined,
    reference:   (r.reference as string)    ?? undefined,
    edited:      (r.edited as boolean)      ?? false,
    promotionId: (r.promotion_id as string) ?? undefined,
    status:      (r.status as CalendarEvent["status"]) ?? undefined,
  }
}
export function eventToRow(e: CalendarEvent) {
  return {
    id:           e.id,
    date:         e.date,
    type:         e.type,
    title:        e.title,
    description:  e.description ?? "",
    lesson_id:    e.lessonId    ?? null,
    class_id:     e.classId     ?? null,
    student_id:   e.studentId   ?? null,
    reference:    e.reference   ?? null,
    edited:       e.edited      ?? false,
    promotion_id: e.promotionId ?? null,
    status:       e.status      ?? null,
  }
}

/* ── Meetings ── */

export function rowToMeeting(r: Record<string, unknown>): Meeting {
  return {
    id:          r.id as string,
    title:       r.title as string,
    date:        r.date as string,
    description: (r.description as string) ?? "",
    createdAt:   (r.created_at as string)  ?? "",
  }
}
export function meetingToRow(m: Meeting) {
  return {
    id:          m.id,
    title:       m.title,
    date:        m.date,
    description: m.description || null,
    created_at:  m.createdAt   || null,
  }
}

/* ── Todos ── */

export function rowToTodo(r: Record<string, unknown>): Todo {
  return {
    id:        r.id as string,
    text:      r.text as string,
    done:      (r.done as boolean) ?? false,
    createdAt: (r.created_at as string) ?? "",
    meetingId: (r.meeting_id as string) ?? undefined,
  }
}
export function todoToRow(t: Todo) {
  return {
    id:         t.id,
    text:       t.text,
    done:       t.done ?? false,
    created_at: t.createdAt || null,
    meeting_id: t.meetingId || null,
  }
}

/* ── Staff teams & members ── */

export function rowToStaffTeam(r: Record<string, unknown>): StaffTeam {
  return {
    id:          r.id as string,
    name:        r.name as string,
    description: (r.description as string) ?? "",
    order:       r.order as number,
  }
}
export function staffTeamToRow(t: StaffTeam) {
  return { id: t.id, name: t.name, description: t.description || null, order: t.order }
}

export function rowToStaffMember(r: Record<string, unknown>): StaffMember {
  return {
    id:     r.id as string,
    teamId: r.team_id as string,
    name:   r.name as string,
    role:   (r.role as string) ?? "",
  }
}
export function staffMemberToRow(m: StaffMember) {
  return { id: m.id, team_id: m.teamId, name: m.name, role: m.role || null }
}

/* ── App credentials ── */

export interface AppCredentialsRow {
  username: string
  password: string
}

export function rowToCredentials(r: Record<string, unknown>): AppCredentialsRow {
  return { username: r.username as string, password: r.password as string }
}

/* ── Batch helpers ── */

export async function upsertEvents(events: CalendarEvent[]) {
  for (let i = 0; i < events.length; i += 500) {
    const { error } = await supabase.from("events").upsert(events.slice(i, i + 500).map(eventToRow))
    if (error) throw error
  }
}

export async function replacePromoEvents(promoId: string, events: CalendarEvent[]) {
  await supabase.from("events").delete().eq("promotion_id", promoId)
  const promoEvents = events.filter((e) => e.promotionId === promoId)
  if (promoEvents.length) await upsertEvents(promoEvents)
}

export async function replaceAllEvents(events: CalendarEvent[]) {
  await supabase.from("events").delete().not("id", "is", null)
  if (events.length) await upsertEvents(events)
}
