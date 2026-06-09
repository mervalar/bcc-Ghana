import type { CalendarEventType } from "./types"
import { BookOpen, Cake, HandHeart, Megaphone, type LucideIcon } from "lucide-react"

interface EventMeta {
  label: string
  icon: LucideIcon
  // Tailwind classes for dot, badge, and calendar chip
  dot: string
  chip: string
  badge: string
}

export const EVENT_META: Record<CalendarEventType, EventMeta> = {
  lesson: {
    label: "Lesson",
    icon: BookOpen,
    dot: "bg-primary",
    chip: "bg-primary/10 text-primary border-primary/20",
    badge: "bg-primary/10 text-primary",
  },
  fellowship: {
    label: "Fellowship",
    icon: HandHeart,
    dot: "bg-chart-3",
    chip: "bg-sky-500/10 text-sky-600 border-sky-500/20",
    badge: "bg-sky-500/10 text-sky-600",
  },
  crusade: {
    label: "Crusade",
    icon: Megaphone,
    dot: "bg-chart-5",
    chip: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    badge: "bg-indigo-500/10 text-indigo-600",
  },
  birthday: {
    label: "Birthday",
    icon: Cake,
    dot: "bg-amber-500",
    chip: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    badge: "bg-amber-500/10 text-amber-600",
  },
}

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
