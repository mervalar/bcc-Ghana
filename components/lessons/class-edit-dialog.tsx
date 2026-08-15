"use client"

import { useEffect, useState } from "react"
import type { BibleClass } from "@/lib/types"
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
  bibleClass: BibleClass | null
}

export function ClassEditDialog({ open, onOpenChange, bibleClass }: Props) {
  const { updateClass } = useStore()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (open && bibleClass) {
      setName(bibleClass.name)
      setDescription(bibleClass.description)
    }
  }, [open, bibleClass])

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (bibleClass) updateClass(bibleClass.id, { name, description })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Edit class</DialogTitle>
            <DialogDescription>Update this class's name and description.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="className">Name</Label>
              <Input id="className" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="classDescription">Description</Label>
              <Textarea id="classDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
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
