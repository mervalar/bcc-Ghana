import { generateSchedule } from "../lib/scheduler"
import { getClassTemplate } from "../lib/seed"
import type { AppData, BibleClass, CalendarEvent, Lesson, Promotion, Student } from "../lib/types"

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
if (!URL || !KEY) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY")

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
}

async function select(table: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${URL}/rest/v1/${table}?select=*`, { headers })
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function upsert(table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return
  const res = await fetch(`${URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  })
  if (!res.ok) throw new Error(`Upsert ${table} failed: ${res.status} ${await res.text()}`)
}

async function deleteAll(table: string) {
  const res = await fetch(`${URL}/rest/v1/${table}?id=not.is.null`, {
    method: "DELETE",
    headers: { ...headers, Prefer: "return=minimal" },
  })
  if (!res.ok) throw new Error(`Delete ${table} failed: ${res.status} ${await res.text()}`)
}

function rowToPromotion(r: Record<string, unknown>): Promotion {
  return { id: r.id as string, name: r.name as string, scheduleStartDate: r.schedule_start_date as string }
}
function rowToStudent(r: Record<string, unknown>): Student {
  return {
    id: r.id as string,
    firstName: r.first_name as string,
    lastName: r.last_name as string,
    email: (r.email as string) ?? "",
    phone: (r.phone as string) ?? "",
    birthday: (r.birthday as string) ?? "",
    classId: (r.class_id as string) ?? "",
    promotionId: (r.promotion_id as string) ?? "",
    status: ((r.status as string) ?? "active") as Student["status"],
    notes: (r.notes as string) ?? "",
  }
}
function rowToEvent(r: Record<string, unknown>): CalendarEvent {
  return {
    id: r.id as string,
    date: r.date as string,
    type: r.type as CalendarEvent["type"],
    title: r.title as string,
    description: (r.description as string) ?? "",
    lessonId: (r.lesson_id as string) ?? undefined,
    classId: (r.class_id as string) ?? undefined,
    studentId: (r.student_id as string) ?? undefined,
    reference: (r.reference as string) ?? undefined,
    edited: (r.edited as boolean) ?? false,
    promotionId: (r.promotion_id as string) ?? undefined,
    status: (r.status as CalendarEvent["status"]) ?? undefined,
  }
}
function classToRow(c: BibleClass) {
  return { id: c.id, name: c.name, order: c.order, description: c.description ?? null }
}
function lessonToRow(l: Lesson) {
  return { id: l.id, class_id: l.classId, title: l.title, order: l.order, description: l.description ?? null, reference: l.reference ?? null }
}
function eventToRow(e: CalendarEvent) {
  return {
    id: e.id,
    date: e.date,
    type: e.type,
    title: e.title,
    description: e.description ?? "",
    lesson_id: e.lessonId ?? null,
    class_id: e.classId ?? null,
    student_id: e.studentId ?? null,
    reference: e.reference ?? null,
    edited: e.edited ?? false,
    promotion_id: e.promotionId ?? null,
    status: e.status ?? null,
  }
}

async function main() {
  const [promoRows, studentRows, eventRows] = await Promise.all([select("promotions"), select("students"), select("events")])

  const promotions = promoRows.map(rowToPromotion)
  const students = studentRows.map(rowToStudent)
  const existingEvents = eventRows.map(rowToEvent)

  console.log(`Found ${promotions.length} promotions, ${students.length} students, ${existingEvents.length} existing events.`)

  const { classes, lessons } = getClassTemplate()
  console.log(`Seeding ${classes.length} classes and ${lessons.length} lessons...`)

  await upsert("classes", classes.map(classToRow))
  await upsert("lessons", lessons.map(lessonToRow))

  const data: AppData = {
    settings: { promotions },
    students,
    classes,
    lessons,
    staffTeams: [],
    staffMembers: [],
    events: existingEvents,
    meetings: [],
    todos: [],
  }

  const newEvents = generateSchedule(data)
  console.log(`Regenerated ${newEvents.length} events. Replacing events table...`)

  await deleteAll("events")
  for (let i = 0; i < newEvents.length; i += 500) {
    await upsert("events", newEvents.slice(i, i + 500).map(eventToRow))
  }

  const counts: Record<string, number> = {}
  for (const e of newEvents) counts[e.type] = (counts[e.type] ?? 0) + 1
  console.log("Done. New event counts:", counts)
}

main().catch((err) => {
  console.error("Failed:", err)
  process.exit(1)
})
