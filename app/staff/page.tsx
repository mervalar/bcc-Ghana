"use client"

import { useEffect, useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import type { StaffMember, StaffTeam } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { TeamFormDialog } from "@/components/staff/team-form-dialog"
import { MemberFormDialog } from "@/components/staff/member-form-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Pencil, Plus, Trash2, Users } from "lucide-react"

export default function StaffPage() {
  const { data, ready, deleteTeam, deleteMember, loadStaffTemplate } = useStore()
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [teamFormOpen, setTeamFormOpen]     = useState(false)
  const [editingTeam, setEditingTeam]       = useState<StaffTeam | null>(null)
  const [teamToDelete, setTeamToDelete]     = useState<StaffTeam | null>(null)
  const [memberFormOpen, setMemberFormOpen] = useState(false)
  const [editingMember, setEditingMember]   = useState<StaffMember | null>(null)
  const [memberToDelete, setMemberToDelete] = useState<StaffMember | null>(null)

  useEffect(() => {
    if (ready && data.staffTeams.length === 0) loadStaffTemplate()
  }, [ready, data.staffTeams.length, loadStaffTemplate])

  const sortedTeams = useMemo(
    () => [...data.staffTeams].sort((a, b) => a.order - b.order),
    [data.staffTeams],
  )

  const activeTeam = selectedTeamId
    ? sortedTeams.find((t) => t.id === selectedTeamId) ?? sortedTeams[0] ?? null
    : sortedTeams[0] ?? null

  const membersForTeam = useMemo(
    () => activeTeam
      ? data.staffMembers.filter((m) => m.teamId === activeTeam.id)
      : [],
    [data.staffMembers, activeTeam],
  )

  const memberCountByTeam = useMemo(() => {
    const map = new Map<string, number>()
    for (const m of data.staffMembers) map.set(m.teamId, (map.get(m.teamId) ?? 0) + 1)
    return map
  }, [data.staffMembers])

  const openAddTeam  = () => { setEditingTeam(null); setTeamFormOpen(true) }
  const openEditTeam = (t: StaffTeam) => { setEditingTeam(t); setTeamFormOpen(true) }

  const openAddMember  = () => { setEditingMember(null); setMemberFormOpen(true) }
  const openEditMember = (m: StaffMember) => { setEditingMember(m); setMemberFormOpen(true) }

  const confirmDeleteTeam = () => {
    if (teamToDelete) {
      if (activeTeam?.id === teamToDelete.id) setSelectedTeamId(null)
      deleteTeam(teamToDelete.id)
      toast.success(`"${teamToDelete.name}" removed.`)
      setTeamToDelete(null)
    }
  }

  const confirmDeleteMember = () => {
    if (memberToDelete) {
      deleteMember(memberToDelete.id)
      toast.success(`${memberToDelete.name} removed.`)
      setMemberToDelete(null)
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader title="Staff & Committee" description="Manage the teams running the promotion and who's on each.">
        <Button onClick={openAddTeam} className="gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Add team
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-[280px_1fr]">
        {/* Teams list */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-foreground">Teams</p>
          </div>
          <nav className="flex flex-col gap-1 p-2">
            {sortedTeams.map((t) => {
              const active = activeTeam?.id === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTeamId(t.id)}
                  className={
                    active
                      ? "flex items-center justify-between gap-2 rounded-lg bg-primary px-3 py-2.5 text-left text-sm font-medium text-primary-foreground"
                      : "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
                  }
                >
                  <span className="truncate">{t.name}</span>
                  <span className={active ? "text-xs text-primary-foreground/80" : "text-xs text-muted-foreground"}>
                    {memberCountByTeam.get(t.id) ?? 0}
                  </span>
                </button>
              )
            })}
            {sortedTeams.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No teams yet.</p>
            )}
          </nav>
        </div>

        {/* Members for selected team */}
        <div className="flex flex-col gap-4">
          {activeTeam && (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{activeTeam.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
                    {activeTeam.description || "No description."}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => openEditTeam(activeTeam)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit team
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={() => setTeamToDelete(activeTeam)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">Members</p>
              {activeTeam && (
                <Button variant="outline" size="sm" className="gap-2" onClick={openAddMember}>
                  <Plus className="size-4" aria-hidden="true" />
                  Add member
                </Button>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-20 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membersForTeam.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-12 text-center text-sm text-muted-foreground">
                      No members in this team yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  membersForTeam.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-foreground">{m.name}</TableCell>
                      <TableCell>
                        {m.role ? (
                          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10">
                            {m.role}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${m.name}`}
                            onClick={() => openEditMember(m)}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${m.name}`}
                            className="text-destructive hover:text-destructive"
                            onClick={() => setMemberToDelete(m)}
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

      <TeamFormDialog open={teamFormOpen} onOpenChange={setTeamFormOpen} team={editingTeam} />
      {activeTeam && (
        <MemberFormDialog
          open={memberFormOpen}
          onOpenChange={setMemberFormOpen}
          teamId={activeTeam.id}
          member={editingMember}
        />
      )}

      <Dialog open={!!teamToDelete} onOpenChange={(o) => !o && setTeamToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete team</DialogTitle>
            <DialogDescription>
              {teamToDelete
                ? `Are you sure you want to remove "${teamToDelete.name}"? This will also remove everyone listed in it. This cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteTeam}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!memberToDelete} onOpenChange={(o) => !o && setMemberToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete member</DialogTitle>
            <DialogDescription>
              {memberToDelete ? `Are you sure you want to remove ${memberToDelete.name}? This cannot be undone.` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteMember}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
