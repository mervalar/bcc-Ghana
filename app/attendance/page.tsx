"use client"

import { useEffect, useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import { fromISO, studentName } from "@/lib/scheduler"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { AlertCircle, BookOpen, CalendarDays, Check, CheckSquare, ClipboardCheck, Users, X } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AttendancePage() {
  const { data, updateEvent } = useStore()

  const [selectedPromoId, setSelectedPromoId] = useState<string>("")
  const [selectedEventId, setSelectedEventId] = useState<string>("")

  // Set default promotion
  useEffect(() => {
    if (data.settings.promotions.length > 0 && !selectedPromoId) {
      setSelectedPromoId(data.settings.promotions[0].id)
    }
  }, [data.settings.promotions, selectedPromoId])

  // Get lessons for selected promotion
  const lessons = useMemo(() => {
    if (!selectedPromoId) return []
    const todayMs = new Date().setHours(0, 0, 0, 0)
    return data.events
      .filter((e) => e.promotionId === selectedPromoId && e.type === "lesson" && e.status !== "done")
      .sort((a, b) => {
        const distA = Math.abs(fromISO(a.date).getTime() - todayMs)
        const distB = Math.abs(fromISO(b.date).getTime() - todayMs)
        return distA - distB
      })
  }, [data.events, selectedPromoId])

  // Set default lesson when promotion changes or selected lesson is completed/removed
  useEffect(() => {
    if (selectedEventId && lessons.some((l) => l.id === selectedEventId)) {
      return
    }

    if (lessons.length > 0) {
      // Find the first lesson that is not done, or default to the latest one
      const activeLesson = lessons.find((l) => l.status !== "done") ?? lessons[0]
      setSelectedEventId(activeLesson.id)
    } else {
      setSelectedEventId("")
    }
  }, [lessons, selectedEventId])

  // Get selected event details
  const selectedEvent = useMemo(() => {
    return data.events.find((e) => e.id === selectedEventId) ?? null
  }, [data.events, selectedEventId])

  const selectedPromoName = useMemo(() => {
    return data.settings.promotions.find((p) => p.id === selectedPromoId)?.name ?? "Choose promotion"
  }, [selectedPromoId, data.settings.promotions])

  const selectedEventName = useMemo(() => {
    if (!selectedEvent) return "Choose lesson"
    return `${selectedEvent.date} — ${selectedEvent.title}`
  }, [selectedEvent])

  // Get active students for selected promotion
  const students = useMemo(() => {
    if (!selectedPromoId) return []
    return data.students
      .filter((s) => s.promotionId === selectedPromoId && s.status === "active")
      .sort((a, b) => studentName(a).localeCompare(studentName(b)))
  }, [data.students, selectedPromoId])

  // Parse present student IDs from event description
  const presentIds = useMemo(() => {
    if (!selectedEvent) return []
    const match = selectedEvent.description?.match(/__ATTENDANCE__\[(.*?)\]/)
    return match ? match[1].split(",").map(id => id.trim()).filter(Boolean) : []
  }, [selectedEvent])

  // Clean description helper
  const cleanDescription = (desc: string | undefined): string => {
    if (!desc) return ""
    return desc.replace(/__ATTENDANCE__\[.*?\]/g, "").trim()
  }

  // Toggle single attendance
  const toggleAttendance = (studentId: string) => {
    if (!selectedEvent) return
    let nextIds: string[]
    if (presentIds.includes(studentId)) {
      nextIds = presentIds.filter((id) => id !== studentId)
    } else {
      nextIds = [...presentIds, studentId]
    }

    saveAttendance(nextIds)
  }

  // Batch actions
  const markAllPresent = () => {
    if (!selectedEvent || students.length === 0) return
    const allIds = students.map((s) => s.id)
    saveAttendance(allIds)
    toast.success("All students marked as present.")
  }

  const clearAttendance = () => {
    if (!selectedEvent) return
    saveAttendance([])
    toast.success("Attendance cleared.")
  }

  const saveAttendance = (ids: string[]) => {
    if (!selectedEvent) return
    const currentDesc = selectedEvent.description ?? ""
    const rawDesc = cleanDescription(currentDesc)
    const nextDesc = `${rawDesc}\n\n__ATTENDANCE__[${ids.join(",")}]`.trim()

    updateEvent(selectedEvent.id, { description: nextDesc })
  }

  // Toggle lesson done state
  const toggleLessonStatus = () => {
    if (!selectedEvent) return
    const nextStatus = selectedEvent.status === "done" ? undefined : "done"
    updateEvent(selectedEvent.id, { status: nextStatus })
    toast.success(nextStatus === "done" ? "Lesson marked as completed!" : "Lesson status set back to active.")
  }

  const attendancePercent = useMemo(() => {
    if (students.length === 0) return 0
    return Math.round((presentIds.length / students.length) * 100)
  }, [students, presentIds])

  return (
    <div className="flex flex-col">
      <PageHeader title="Attendance" description="Record student attendance for scheduled classes." />

      {data.settings.promotions.length === 0 ? (
        <div className="p-6">
          <Card className="flex flex-col items-center justify-center border-dashed py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <ClipboardCheck className="size-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <CardHeader>
              <CardTitle>No promotions found</CardTitle>
              <CardDescription>
                Create a promotion in Settings first to generate schedules and enroll students.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col gap-6 p-6">
          {/* Controls Panel */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold">1. Select Promotion</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <Select value={selectedPromoId} onValueChange={(v) => setSelectedPromoId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose promotion">{selectedPromoName}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {data.settings.promotions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold">2. Select Class / Lesson Date</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {lessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No lesson events scheduled.</p>
                ) : (
                  <Select value={selectedEventId} onValueChange={(v) => setSelectedEventId(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose lesson">{selectedEventName}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {lessons.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.date} — {l.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          </div>

          {selectedEvent ? (
            <div className="flex flex-col gap-6">
              {/* Lesson Summary Card */}
              <Card className="overflow-hidden border-l-4 border-l-primary">
                <div className="grid gap-4 p-6 sm:grid-cols-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">Class Name</span>
                    <h2 className="mt-1 truncate text-lg font-bold text-foreground">{selectedEvent.title}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      Scheduled on {selectedEvent.date}
                    </p>
                  </div>

                  <div className="flex flex-col justify-center border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Class Status</span>
                    <div className="mt-2 flex items-center gap-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          selectedEvent.status === "done"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        )}
                      >
                        {selectedEvent.status === "done" ? "Completed" : "Active"}
                      </span>
                      <Button variant="outline" size="sm" onClick={toggleLessonStatus} className="h-7 px-2.5 text-xs">
                        {selectedEvent.status === "done" ? "Set Active" : "Mark Completed"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Lesson Attendance</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-foreground">
                        {presentIds.length} <span className="text-sm font-normal text-muted-foreground">/ {students.length}</span>
                      </span>
                      {students.length > 0 && (
                        <span className="text-sm font-semibold text-primary">{attendancePercent}%</span>
                      )}
                    </div>
                    {students.length > 0 && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${attendancePercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {cleanDescription(selectedEvent.description) && (
                  <div className="border-t border-border bg-muted/20 px-6 py-3 text-xs text-muted-foreground italic">
                    {cleanDescription(selectedEvent.description)}
                  </div>
                )}
              </Card>

              {/* Student Attendance List */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border pb-4">
                  <div className="min-w-0">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Users className="size-4 text-primary" />
                      Student Roll
                    </CardTitle>
                    <CardDescription>Mark student attendance for this session.</CardDescription>
                  </div>
                  {students.length > 0 && (
                    <div className="flex shrink-0 items-center gap-2">
                      <Button variant="outline" size="sm" onClick={markAllPresent} className="h-8 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                        All Present
                      </Button>
                      <Button variant="ghost" size="sm" onClick={clearAttendance} className="h-8 text-xs font-semibold text-muted-foreground hover:text-destructive">
                        Clear
                      </Button>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-0">
                  {students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-sm text-muted-foreground">
                      <AlertCircle className="size-6 text-muted-foreground/40 mb-2" />
                      No active students found in this promotion.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Student Name</TableHead>
                          <TableHead className="hidden sm:table-cell">Contact Details</TableHead>
                          <TableHead className="w-36 text-center">Attendance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => {
                          const isPresent = presentIds.includes(student.id)
                          return (
                            <TableRow key={student.id} className={isPresent ? "bg-emerald-50/20" : ""}>
                              <TableCell className="font-semibold text-foreground">
                                {studentName(student)}
                              </TableCell>
                              <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                                {student.email && <div>{student.email}</div>}
                                {student.phone && <div>{student.phone}</div>}
                                {!student.email && !student.phone && "—"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleAttendance(student.id)}
                                  className={cn(
                                    "h-8 w-28 gap-1 rounded-full text-xs font-bold transition-all",
                                    isPresent
                                      ? "border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                      : "border-border text-muted-foreground hover:bg-muted"
                                  )}
                                >
                                  {isPresent ? (
                                    <>
                                      <Check className="size-3.5 stroke-[3]" />
                                      Present
                                    </>
                                  ) : (
                                    <>
                                      <X className="size-3.5" />
                                      Absent
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            selectedPromoId && (
              <Card className="flex flex-col items-center justify-center border-dashed py-14 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                  <BookOpen className="size-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <CardHeader>
                  <CardTitle>No lessons found</CardTitle>
                  <CardDescription>
                    This promotion has no lessons scheduled. Please check Settings to configure schedules.
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  )
}
