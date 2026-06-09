export type StudentStatus = "active" | "inactive"

export interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  /** ISO date yyyy-mm-dd */
  birthday: string
  classId: string | null
  status: StudentStatus
  notes: string
}

export interface BibleClass {
  id: string
  name: string
  order: number
  description: string
}

export interface Lesson {
  id: string
  classId: string
  title: string
  order: number
  description: string
  reference: string
}

export type CalendarEventType = "lesson" | "fellowship" | "crusade" | "birthday"

export interface CalendarEvent {
  id: string
  /** ISO date yyyy-mm-dd */
  date: string
  type: CalendarEventType
  title: string
  description: string
  /** Linked lesson (for lesson events) */
  lessonId?: string
  /** Linked class (for lesson / crusade events) */
  classId?: string
  /** Linked student (for birthday events) */
  studentId?: string
  reference?: string
  /** true once an admin manually edited this event (protected on regenerate) */
  edited?: boolean
}

export interface Todo {
  id: string
  text: string
  done: boolean
  createdAt: string
  /** When set, this todo belongs to a meeting instead of the global list */
  meetingId?: string
}

export interface Meeting {
  id: string
  title: string
  /** ISO date yyyy-mm-dd */
  date: string
  description: string
  createdAt: string
}

export interface Settings {
  promotionName: string
  /** ISO date yyyy-mm-dd */
  scheduleStartDate: string
}

export interface AppData {
  settings: Settings
  students: Student[]
  classes: BibleClass[]
  lessons: Lesson[]
  events: CalendarEvent[]
  meetings: Meeting[]
  todos: Todo[]
}

/** Shape of an imported / exported JSON file */
export interface ImportPayload {
  students?: Array<Omit<Student, "id"> & { id?: string }>
  classes?: BibleClass[]
  lessons?: Lesson[]
}
