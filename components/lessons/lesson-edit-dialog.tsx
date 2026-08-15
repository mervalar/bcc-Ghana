"use client"

import { useEffect, useState } from "react"
import type { Lesson } from "@/lib/types"
import { useStore } from "@/lib/store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  lesson: Lesson | null
}

export function LessonEditDialog({ open, onOpenChange, lesson }: Props) {
  const { updateLesson } = useStore()
  const [title, setTitle] = useState("")
  const [reference, setReference] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (open && lesson) {
      setTitle(lesson.title)
      setReference(lesson.reference)
      setDescription(lesson.description)
    }
  }, [open, lesson])

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (lesson) updateLesson(lesson.id, { title, reference, description })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Edit lesson</DialogTitle>
            <DialogDescription>Update this lesson's title, reference, and description.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="lessonTitle">Title</Label>
              <Input id="lessonTitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lessonReference">Reference</Label>
              <Input id="lessonReference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. Jean 3:16" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lessonDescription">Description</Label>
              <Textarea id="lessonDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
