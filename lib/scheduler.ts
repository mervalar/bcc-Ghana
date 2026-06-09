import type { AppData, BibleClass, CalendarEvent, Lesson, Student } from "./types"

/* ----------------------------- date helpers ----------------------------- */

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/** 0 = Sun, 5 = Fri, 6 = Sat */
function nextOrSameWeekday(d: Date, weekday: number): Date {
  const r = new Date(d)
  const diff = (weekday - r.getDay() + 7) % 7
  r.setDate(r.getDate() + diff)
  return r
}

/* --------------------------- schedule generation -------------------------- */

/**
 * Builds the full academic calendar.
 *
 * Rules:
 *  - One lesson every Friday and one every Saturday, in class+lesson order.
 *  - A Fellowship every Sunday.
 *  - When a class finishes (all its lessons taught) and another class follows,
 *    insert a two-day Crusade (the next Friday & Saturday) before the next class.
 *  - Student birthdays are added on their birthday (mapped into the schedule's year span).
 *
 * Manually edited events (edited === true) are preserved by date+type.
 */
export function generateSchedule(data: AppData): CalendarEvent[] {
  const { classes, lessons, students, settings } = data

  // Preserve manual edits keyed by `${date}|${type}`
  const editedMap = new Map<string, CalendarEvent>()
  for (const ev of data.events) {
    if (ev.edited) editedMap.set(`${ev.date}|${ev.type}`, ev)
  }

  const events: CalendarEvent[] = []
  const sortedClasses = [...classes].sort((a, b) => a.order - b.order)

  const start = fromISO(settings.scheduleStartDate)
  // teaching cursor starts on the first Friday on/after start date
  let cursor = nextOrSameWeekday(start, 5) // Friday

  const pushTeaching = (date: Date, lesson: Lesson, cls: BibleClass) => {
    const iso = toISO(date)
    const base: CalendarEvent = {
      id: `lesson-${lesson.id}`,
      date: iso,
      type: "lesson",
      title: `${cls.name} - Lesson ${lesson.order}`,
      description: lesson.title,
      lessonId: lesson.id,
      classId: cls.id,
      reference: lesson.reference,
    }
    events.push(mergeEdit(base, editedMap))
  }

  // advance cursor to the next Fri or Sat teaching slot
  const advanceSlot = (d: Date): Date => {
    // if Friday -> Saturday (next day); else jump to next Friday
    if (d.getDay() === 5) return addDays(d, 1)
    return nextOrSameWeekday(addDays(d, 1), 5)
  }

  let lastTeachingDate: Date | null = null

  for (let ci = 0; ci < sortedClasses.length; ci++) {
    const cls = sortedClasses[ci]
    const classLessons = lessons
      .filter((l) => l.classId === cls.id)
      .sort((a, b) => a.order - b.order)

    for (const lesson of classLessons) {
      // make sure cursor is a Fri or Sat
      if (cursor.getDay() !== 5 && cursor.getDay() !== 6) {
        cursor = nextOrSameWeekday(cursor, 5)
      }
      pushTeaching(cursor, lesson, cls)
      lastTeachingDate = new Date(cursor)
      cursor = advanceSlot(cursor)
    }

    // Insert a 2-day crusade between this finished class and the next one
    const hasNext = ci < sortedClasses.length - 1
    if (hasNext && classLessons.length > 0) {
      const crusadeFri = nextOrSameWeekday(cursor.getDay() === 5 ? cursor : cursor, 5)
      const friISO = toISO(crusadeFri)
      const sat = addDays(crusadeFri, 1)
      const satISO = toISO(sat)
      events.push(
        mergeEdit(
          {
            id: `crusade-${cls.id}-fri`,
            date: friISO,
            type: "crusade",
            title: `Crusade — after ${cls.name}`,
            description: `Two-day crusade following the completion of ${cls.name}.`,
            classId: cls.id,
          },
          editedMap,
        ),
      )
      events.push(
        mergeEdit(
          {
            id: `crusade-${cls.id}-sat`,
            date: satISO,
            type: "crusade",
            title: `Crusade — after ${cls.name}`,
            description: `Two-day crusade following the completion of ${cls.name}.`,
            classId: cls.id,
          },
          editedMap,
        ),
      )
      // resume teaching the Friday after the crusade weekend
      cursor = nextOrSameWeekday(addDays(sat, 1), 5)
    }
  }

  // Determine the span for Sundays & birthdays
  const spanStart = start
  const spanEnd = lastTeachingDate ? addDays(lastTeachingDate, 14) : addDays(start, 7 * 30)

  // Fellowship every Sunday in the span
  let sunday = nextOrSameWeekday(spanStart, 0)
  while (sunday <= spanEnd) {
    const iso = toISO(sunday)
    events.push(
      mergeEdit(
        {
          id: `fellowship-${iso}`,
          date: iso,
          type: "fellowship",
          title: "Sunday Fellowship",
          description: "Weekly fellowship gathering.",
        },
        editedMap,
      ),
    )
    sunday = addDays(sunday, 7)
  }

  // Birthdays — map each student's birthday into every year covered by the span
  const years = new Set<number>()
  for (let y = spanStart.getFullYear(); y <= spanEnd.getFullYear(); y++) years.add(y)
  for (const student of students) {
    if (!student.birthday) continue
    const [, bm, bd] = student.birthday.split("-").map(Number)
    if (!bm || !bd) continue
    for (const y of years) {
      const bdayDate = new Date(y, bm - 1, bd)
      if (bdayDate < spanStart || bdayDate > spanEnd) continue
      const iso = toISO(bdayDate)
      events.push(
        mergeEdit(
          {
            id: `birthday-${student.id}-${y}`,
            date: iso,
            type: "birthday",
            title: `${student.firstName} ${student.lastName}'s Birthday`,
            description: `Celebrate ${student.firstName}'s birthday.`,
            studentId: student.id,
          },
          editedMap,
        ),
      )
    }
  }

  return events
}

/** If an edited event exists for this date+type, keep the admin's edits but
 *  retain links/ids from the freshly generated event. */
function mergeEdit(base: CalendarEvent, editedMap: Map<string, CalendarEvent>): CalendarEvent {
  const key = `${base.date}|${base.type}`
  const edited = editedMap.get(key)
  if (!edited) return base
  return {
    ...base,
    title: edited.title,
    description: edited.description,
    reference: edited.reference ?? base.reference,
    edited: true,
  }
}

export function eventsForDate(events: CalendarEvent[], iso: string): CalendarEvent[] {
  const order: Record<string, number> = { lesson: 0, crusade: 1, fellowship: 2, birthday: 3 }
  return events
    .filter((e) => e.date === iso)
    .sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9))
}

/** Helper used by dashboard stats */
export function summarize(events: CalendarEvent[]) {
  const counts = { lesson: 0, fellowship: 0, crusade: 0, birthday: 0 }
  for (const e of events) counts[e.type]++
  return counts
}

/** Map a Student to a display name */
export function studentName(s: Student): string {
  return `${s.firstName} ${s.lastName}`.trim()
}
