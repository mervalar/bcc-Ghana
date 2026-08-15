"use client"

import { useEffect, useState } from "react"
import type { StaffTeam } from "@/lib/types"
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
  team: StaffTeam | null
}

export function TeamFormDialog({ open, onOpenChange, team }: Props) {
  const { addTeam, updateTeam } = useStore()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (open) {
      setName(team?.name ?? "")
      setDescription(team?.description ?? "")
    }
  }, [open, team])

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (team) updateTeam(team.id, { name, description })
    else addTeam({ name, description })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{team ? "Edit team" : "Add team"}</DialogTitle>
            <DialogDescription>
              {team ? "Update this team's title and description." : "Add a new team or committee title."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="teamName">Title</Label>
              <Input id="teamName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Media Team" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="teamDescription">What they do</Label>
              <Textarea id="teamDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{team ? "Save changes" : "Add team"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
