"use client"

import { useEffect, useState } from "react"
import type { StaffMember } from "@/lib/types"
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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
  member: StaffMember | null
}

export function MemberFormDialog({ open, onOpenChange, teamId, member }: Props) {
  const { addMember, updateMember } = useStore()
  const [name, setName] = useState("")
  const [role, setRole] = useState("")

  useEffect(() => {
    if (open) {
      setName(member?.name ?? "")
      setRole(member?.role ?? "")
    }
  }, [open, member])

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (member) updateMember(member.id, { name, role })
    else addMember({ teamId, name, role })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{member ? "Edit member" : "Add member"}</DialogTitle>
            <DialogDescription>
              {member ? "Update this team member's details." : "Add a person to this team."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="memberName">Name</Label>
              <Input id="memberName" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="memberRole">Role (optional)</Label>
              <Input id="memberRole" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Co-Head" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{member ? "Save changes" : "Add member"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
