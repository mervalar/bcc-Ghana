import { createClient } from "@supabase/supabase-js"
import type { Student } from "./types"

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

/* ── Row ↔ Student mappers ── */

type StudentRow = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  birthday: string | null
  class_id: string | null
  promotion_id: string | null
  status: string
  notes: string | null
}

export function rowToStudent(row: StudentRow): Student {
  return {
    id:          row.id,
    firstName:   row.first_name,
    lastName:    row.last_name,
    email:       row.email ?? "",
    phone:       row.phone ?? "",
    birthday:    row.birthday ?? "",
    classId:     row.class_id ?? "",
    promotionId: row.promotion_id ?? "",
    status:      (row.status as Student["status"]) ?? "active",
    notes:       row.notes ?? "",
  }
}

export function studentToRow(s: Student): StudentRow {
  return {
    id:           s.id,
    first_name:   s.firstName,
    last_name:    s.lastName,
    email:        s.email   || null,
    phone:        s.phone   || null,
    birthday:     s.birthday || null,
    class_id:     s.classId || null,
    promotion_id: s.promotionId || null,
    status:       s.status ?? "active",
    notes:        s.notes  || null,
  }
}

export function partialStudentToRow(s: Partial<Student>): Partial<StudentRow> {
  const row: Partial<StudentRow> = {}
  if (s.firstName   !== undefined) row.first_name   = s.firstName
  if (s.lastName    !== undefined) row.last_name    = s.lastName
  if (s.email       !== undefined) row.email        = s.email || null
  if (s.phone       !== undefined) row.phone        = s.phone || null
  if (s.birthday    !== undefined) row.birthday     = s.birthday || null
  if (s.classId     !== undefined) row.class_id     = s.classId || null
  if (s.promotionId !== undefined) row.promotion_id = s.promotionId || null
  if (s.status      !== undefined) row.status       = s.status
  if (s.notes       !== undefined) row.notes        = s.notes || null
  return row
}
