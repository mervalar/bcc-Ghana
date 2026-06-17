const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: 'c:/Users/Amalitech/Documents/bcc-Ghana/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- Copy of parseCSV / normBirthday from lib/csv.ts ---
function parseRow(line) {
  const fields = []
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

const FIELD_PATTERNS = {
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

function findCol(headers, patterns) {
  for (const pat of patterns) {
    const i = headers.findIndex((h) => h.includes(pat) || pat.includes(h))
    if (i >= 0) return i
  }
  return -1
}

function normBirthday(raw) {
  if (!raw) return ""
  raw = raw.replace(/^Le\s*/i, "").trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`
  const m2 = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-]?$/)
  if (m2) {
    const year = new Date().getFullYear()
    return `${year}-${m2[2].padStart(2, "0")}-${m2[1].padStart(2, "0")}`
  }
  const d = new Date(raw)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return ""
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []

  const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim())

  const col = {}
  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    const i = findCol(headers, patterns)
    if (i >= 0) col[field] = i
  }

  const fullNameIdx = findCol(headers, ["full name", "name", "nom", "nom complet", "student name"])

  return lines.slice(1)
    .map((line) => {
      const cells = parseRow(line)
      const get = (i) => (i != null && i >= 0 ? (cells[i] ?? "").trim() : "")

      let firstName = get(col.firstName)
      let lastName  = get(col.lastName)

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
        status:   get(col.status) || "active",
      }
    })
    .filter((s) => s.firstName || s.lastName)
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

function studentToRow(s) {
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

async function run() {
  try {
    const csvText = fs.readFileSync('C:/Users/Amalitech/Downloads/BCC GHANA FAMILY.csv', 'utf-8');
    const rows = parseCSV(csvText);
    console.log(`Parsed ${rows.length} rows from CSV.`);

    // 1. Insert promotion
    const promoId = uid("promo");
    console.log(`Inserting promotion ${promoId}...`);
    const { error: promoErr } = await supabase.from("promotions").insert({
      id: promoId,
      name: "Test Promo Import",
      schedule_start_date: "2026-06-19"
    });

    if (promoErr) {
      console.error("Promo insertion error:", promoErr);
      return;
    }
    console.log("Promotion inserted successfully.");

    // 2. Map and insert students
    const newStudents = rows.map((s) => ({
      id: s.id ?? uid("st"),
      firstName: s.firstName ?? "",
      lastName: s.lastName ?? "",
      email: s.email ?? "",
      phone: s.phone ?? "",
      birthday: s.birthday ?? "",
      classId: s.classId ?? "",
      promotionId: promoId,
      status: s.status ?? "active",
      notes: s.notes ?? ""
    }));

    const rowsToInsert = newStudents.map(studentToRow);
    console.log(`Inserting ${rowsToInsert.length} students into DB...`);
    const { error: studentErr } = await supabase.from("students").upsert(rowsToInsert);
    if (studentErr) {
      console.error("Student insertion error:", studentErr);
    } else {
      console.log("SUCCESS: Imported students inserted.");
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

run();
