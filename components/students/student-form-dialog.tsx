"use client"

import { useEffect, useState } from "react"
import type { Student } from "@/lib/types"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Draft = Omit<Student, "id">

const EMPTY: Draft = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthday: "",
  classId: null,
  status: "active",
  notes: "",
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null // null = create
}

export function StudentFormDialog({ open, onOpenChange, student }: Props) {
  const { data, addStudent, updateStudent } = useStore()
  const [draft, setDraft] = useState<Draft>(EMPTY)

  useEffect(() => {
    if (open) {
      setDraft(student ? { ...student } : EMPTY)
    }
  }, [open, student])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (student) {
      updateStudent(student.id, draft)
    } else {
      addStudent(draft)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{student ? "Edit student" : "Add student"}</DialogTitle>
            <DialogDescription>
              {student ? "Update this student's information." : "Add a new student to the promotion."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={draft.firstName} onChange={(e) => set("firstName", e.target.value)} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={draft.lastName} onChange={(e) => set("lastName", e.target.value)} required />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="birthday">Birthday</Label>
                <Input id="birthday" type="date" value={draft.birthday} onChange={(e) => set("birthday", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="class">Class</Label>
                <Select
                  value={draft.classId ?? "none"}
                  onValueChange={(v) => set("classId", v === "none" ? null : v)}
                >
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {data.classes
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={draft.status} onValueChange={(v) => set("status", v as Draft["status"])}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={draft.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{student ? "Save changes" : "Add student"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
