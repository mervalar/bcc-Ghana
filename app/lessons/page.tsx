"use client"

import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import type { BibleClass, Lesson } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { ClassEditDialog } from "@/components/lessons/class-edit-dialog"
import { LessonEditDialog } from "@/components/lessons/lesson-edit-dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { BookOpen, Pencil, Trash2 } from "lucide-react"

export default function LessonsPage() {
  const { data, deleteLesson } = useStore()
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [editingClass, setEditingClass]   = useState<BibleClass | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [toDelete, setToDelete]           = useState<Lesson | null>(null)

  const sortedClasses = useMemo(
    () => [...data.classes].sort((a, b) => a.order - b.order),
    [data.classes],
  )

  const activeClass = selectedClassId
    ? sortedClasses.find((c) => c.id === selectedClassId) ?? sortedClasses[0] ?? null
    : sortedClasses[0] ?? null

  const lessonsForClass = useMemo(
    () => activeClass
      ? [...data.lessons].filter((l) => l.classId === activeClass.id).sort((a, b) => a.order - b.order)
      : [],
    [data.lessons, activeClass],
  )

  const lessonCountByClass = useMemo(() => {
    const map = new Map<string, number>()
    for (const l of data.lessons) map.set(l.classId, (map.get(l.classId) ?? 0) + 1)
    return map
  }, [data.lessons])

  const confirmDelete = () => {
    if (toDelete) {
      deleteLesson(toDelete.id)
      toast.success(`"${toDelete.title}" removed.`)
      setToDelete(null)
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader title="Lessons" description="Manage the classes and lessons used to build the schedule." />

      <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-[280px_1fr]">
        {/* Classes list */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-foreground">Classes</p>
          </div>
          <nav className="flex flex-col gap-1 p-2">
            {sortedClasses.map((c) => {
              const active = activeClass?.id === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedClassId(c.id)}
                  className={
                    active
                      ? "flex items-center justify-between gap-2 rounded-lg bg-primary px-3 py-2.5 text-left text-sm font-medium text-primary-foreground"
                      : "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
                  }
                >
                  <span className="truncate">{c.name}</span>
                  <span className={active ? "text-xs text-primary-foreground/80" : "text-xs text-muted-foreground"}>
                    {lessonCountByClass.get(c.id) ?? 0}
                  </span>
                </button>
              )
            })}
            {sortedClasses.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No classes yet.</p>
            )}
          </nav>
        </div>

        {/* Lessons for selected class */}
        <div className="flex flex-col gap-4">
          {activeClass && (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{activeClass.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
                    {activeClass.description || "No description."}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 gap-2" onClick={() => setEditingClass(activeClass)}>
                <Pencil className="size-4" aria-hidden="true" />
                Edit class
              </Button>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="w-20 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessonsForClass.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                      No lessons in this class.
                    </TableCell>
                  </TableRow>
                ) : (
                  lessonsForClass.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-muted-foreground">{l.order}</TableCell>
                      <TableCell className="font-medium text-foreground">{l.title}</TableCell>
                      <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                        {l.description || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${l.title}`}
                            onClick={() => setEditingLesson(l)}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${l.title}`}
                            className="text-destructive hover:text-destructive"
                            onClick={() => setToDelete(l)}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <ClassEditDialog open={!!editingClass} onOpenChange={(o) => !o && setEditingClass(null)} bibleClass={editingClass} />
      <LessonEditDialog open={!!editingLesson} onOpenChange={(o) => !o && setEditingLesson(null)} lesson={editingLesson} />

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete lesson</DialogTitle>
            <DialogDescription>
              {toDelete ? `Are you sure you want to remove "${toDelete.title}"? This will also remove it from the calendar. This cannot be undone.` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
