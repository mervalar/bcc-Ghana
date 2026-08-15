import type { ImportPayload } from "./types"

type StudentRow = NonNullable<ImportPayload["students"]>[number]

/* ── low-level CSV parser (handles quoted fields with commas inside) ── */

function parseRow(line: string): string[] {
  const fields: string[] = []
  let cur = ""
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (ch === "," && !inQ) {
      fields.push(cur.trim())
      cur = ""
    } else {
      cur += ch
    }
  }
  fields.push(cur.trim())
  return fields
}

/* ── flexible header → field mapping ── */

const FIELD_PATTERNS: Record<keyof Omit<StudentRow, "id">, string[]> = {
  firstName:   ["first name", "firstname", "first", "prénom", "given name", "prenom"],
  lastName:    ["last name", "lastname", "last", "surname", "family name", "nom", "family"],
  email:       ["email", "e-mail", "mail", "courriel"],
  phone:       ["phone", "mobile", "telephone", "tel", "whatsapp", "contact"],
  birthday:    ["birthday", "date of birth", "dob", "birth date", "born", "date naissance"],
  notes:       ["notes", "note", "comments", "country", "location", "ville", "pays", "remarks", "city"],
  classId:     ["class", "classid", "class id"],
  promotionId: ["promotion", "promotionid", "promo"],
  status:      ["status", "statut"],
}

function findCol(headers: string[], patterns: string[]): number {
  for (const pat of patterns) {
    const i = headers.findIndex((h) => h.includes(pat) || pat.includes(h))
    if (i >= 0) return i
  }
  return -1
}

/* ── birthday normaliser — handles yyyy-mm-dd, dd/mm/yyyy, dd-mm-yyyy, dd/mm ── */

function normBirthday(raw: string): string {
  if (!raw) return ""
  raw = raw.replace(/^Le\s*/i, "").trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  
  // dd/mm/yyyy or dd-mm-yyyy
  const m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`
  
  // dd/mm or dd-mm (with optional trailing slash/dash)
  const m2 = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-]?$/)
  if (m2) {
    const year = new Date().getFullYear()
    return `${year}-${m2[2].padStart(2, "0")}-${m2[1].padStart(2, "0")}`
  }
  
  // fallback: let JS parse it
  const d = new Date(raw)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return ""
}

/* ── main export ── */

export function parseCSV(text: string): StudentRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []

  const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim())

  const col: Partial<Record<keyof Omit<StudentRow, "id">, number>> = {}
  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    const i = findCol(headers, patterns)
    if (i >= 0) col[field as keyof typeof col] = i
  }

  // Detect a "full name" column as fallback
  const fullNameIdx = findCol(headers, ["full name", "name", "nom", "nom complet", "student name"])

  return lines.slice(1)
    .map((line) => {
      const cells = parseRow(line)
      const get = (i: number | undefined) => (i != null && i >= 0 ? (cells[i] ?? "").trim() : "")

      let firstName = get(col.firstName)
      let lastName  = get(col.lastName)

      // Split a "Full name" column if dedicated columns are absent
      if (!firstName && !lastName && fullNameIdx >= 0) {
        const full = get(fullNameIdx)
        const parts = full.split(/\s+/)
        firstName = parts[0] ?? ""
        lastName  = parts.slice(1).join(" ")
      }

      return {
        firstName,
        lastName,
        email:    get(col.email),
        phone:    get(col.phone),
        birthday: normBirthday(get(col.birthday)),
        notes:    get(col.notes),
        classId:  get(col.classId) || null,
        promotionId: null,
        status:   (get(col.status) || "active") as StudentRow["status"],
      } satisfies Omit<StudentRow, "id">
    })
    .filter((s) => s.firstName || s.lastName)
}
