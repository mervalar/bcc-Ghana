import type { AppData, BibleClass, CalendarEvent, Lesson, Promotion, Student } from "./types"

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

/* ----------------------- per-promotion generation ----------------------- */

function generateForPromotion(
  promotion: Promotion,
  classes: BibleClass[],
  lessons: Lesson[],
  editedMap: Map<string, CalendarEvent>,
): { events: CalendarEvent[]; spanStart: Date; spanEnd: Date } {
  const pid = promotion.id
  const events: CalendarEvent[] = []
  const sortedClasses = [...classes].sort((a, b) => a.order - b.order)

  const start = fromISO(promotion.scheduleStartDate)
  let cursor = nextOrSameWeekday(start, 5) // first Friday

  const pushTeaching = (date: Date, lesson: Lesson, cls: BibleClass) => {
    const iso = toISO(date)
    const base: CalendarEvent = {
      id: `${pid}-lesson-${lesson.id}`,
      date: iso,
      type: "lesson",
      title: `${cls.name} - Lesson ${lesson.order}`,
      description: lesson.title,
      lessonId: lesson.id,
      classId: cls.id,
      reference: lesson.reference,
      promotionId: pid,
    }
    events.push(mergeEdit(base, editedMap))
  }

  const advanceSlot = (d: Date): Date => {
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
      if (cursor.getDay() !== 5 && cursor.getDay() !== 6) {
        cursor = nextOrSameWeekday(cursor, 5)
      }
      pushTeaching(cursor, lesson, cls)
      lastTeachingDate = new Date(cursor)
      cursor = advanceSlot(cursor)
    }

    const hasNext = ci < sortedClasses.length - 1
    if (hasNext && classLessons.length > 0) {
      const crusadeFri = nextOrSameWeekday(cursor.getDay() === 5 ? cursor : cursor, 5)
      const friISO = toISO(crusadeFri)
      const sat = addDays(crusadeFri, 1)
      const satISO = toISO(sat)
      events.push(
        mergeEdit(
          { id: `${pid}-crusade-${cls.id}-fri`, date: friISO, type: "crusade", title: `Crusade — after ${cls.name}`, description: `Two-day crusade following the completion of ${cls.name}.`, classId: cls.id, promotionId: pid },
          editedMap,
        ),
      )
      events.push(
        mergeEdit(
          { id: `${pid}-crusade-${cls.id}-sat`, date: satISO, type: "crusade", title: `Crusade — after ${cls.name}`, description: `Two-day crusade following the completion of ${cls.name}.`, classId: cls.id, promotionId: pid },
          editedMap,
        ),
      )
      cursor = nextOrSameWeekday(addDays(sat, 1), 5)
    }
  }

  const spanEnd = lastTeachingDate ? addDays(lastTeachingDate, 14) : addDays(start, 7 * 30)

  // Fellowships every Sunday in this promotion's span
  let sunday = nextOrSameWeekday(start, 0)
  while (sunday <= spanEnd) {
    const iso = toISO(sunday)
    events.push(
      mergeEdit(
        { id: `${pid}-fellowship-${iso}`, date: iso, type: "fellowship", title: "Sunday Fellowship", description: "Weekly fellowship gathering.", promotionId: pid },
        editedMap,
      ),
    )
    sunday = addDays(sunday, 7)
  }

  return { events, spanStart: start, spanEnd }
}

/* --------------------------- schedule generation -------------------------- */

/**
 * Generates the full calendar from all promotions.
 * - Lesson / fellowship / crusade events are tagged with promotionId.
 * - Birthday events have no promotionId (always visible regardless of filter).
 */
export function generateSchedule(data: AppData): CalendarEvent[] {
  const { classes, lessons, students, settings } = data
  const { promotions } = settings

  // Build edited map keyed by `${promotionId}|${date}|${type}` (or `${date}|birthday`)
  const editedMap = new Map<string, CalendarEvent>()
  for (const ev of data.events) {
    if (ev.edited) {
      const key = ev.promotionId
        ? `${ev.promotionId}|${ev.date}|${ev.type}`
        : `${ev.date}|${ev.type}`
      editedMap.set(key, ev)
    }
  }

  const allEvents: CalendarEvent[] = []
  let overallStart: Date | null = null
  let overallEnd: Date | null = null

  for (const promotion of promotions) {
    const { events, spanStart, spanEnd } = generateForPromotion(promotion, classes, lessons, editedMap)
    allEvents.push(...events)
    if (!overallStart || spanStart < overallStart) overallStart = spanStart
    if (!overallEnd || spanEnd > overallEnd) overallEnd = spanEnd
  }

  // Birthdays — generated once, spanning all promotions, no promotionId
  if (overallStart && overallEnd) {
    const years = new Set<number>()
    for (let y = overallStart.getFullYear(); y <= overallEnd.getFullYear(); y++) years.add(y)

    for (const student of students) {
      if (!student.birthday) continue
      const [, bm, bd] = student.birthday.split("-").map(Number)
      if (!bm || !bd) continue
      for (const y of years) {
        const bdayDate = new Date(y, bm - 1, bd)
        if (bdayDate < overallStart || bdayDate > overallEnd) continue
        const iso = toISO(bdayDate)
        allEvents.push(
          mergeEdit(
            { id: `birthday-${student.id}-${y}`, date: iso, type: "birthday", title: `${student.firstName} ${student.lastName}'s Birthday`, description: `Celebrate ${student.firstName}'s birthday.`, studentId: student.id },
            editedMap,
          ),
        )
      }
    }
  }

  return allEvents
}

function mergeEdit(base: CalendarEvent, editedMap: Map<string, CalendarEvent>): CalendarEvent {
  const key = base.promotionId
    ? `${base.promotionId}|${base.date}|${base.type}`
    : `${base.date}|${base.type}`
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

/** Filter events by promotion: promoId "all" returns everything; birthday events always included */
export function filterByPromotion(events: CalendarEvent[], promoId: string): CalendarEvent[] {
  if (promoId === "all") return events
  return events.filter((e) => !e.promotionId || e.promotionId === promoId)
}

/** Map a Student to a display name */
export function studentName(s: Student): string {
  return `${s.firstName} ${s.lastName}`.trim()
}
