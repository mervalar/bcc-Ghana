"use client"

import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import type { Student } from "@/lib/types"
import { studentName } from "@/lib/scheduler"
import { PageHeader } from "@/components/page-header"
import { StudentFormDialog } from "@/components/students/student-form-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { MoreHorizontal, Pencil, Plus, Search, Trash2, UserRound, Users } from "lucide-react"
import { cn } from "@/lib/utils"

function formatBirthday(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function StudentsPage() {
  const { data, deleteStudent } = useStore()
  const [query, setQuery]         = useState("")
  const [promoFilter, setPromoFilter] = useState("all")
  const [formOpen, setFormOpen]   = useState(false)
  const [editing, setEditing]     = useState<Student | null>(null)
  const [toDelete, setToDelete]   = useState<Student | null>(null)

  const promoNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of data.settings.promotions) map.set(p.id, p.name)
    return map
  }, [data.settings.promotions])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...data.students]
      .sort((a, b) => studentName(a).localeCompare(studentName(b)))
      .filter((s) => {
        if (promoFilter !== "all" && s.promotionId !== promoFilter) return false
        if (!q) return true
        const promo = s.promotionId ? promoNameById.get(s.promotionId) ?? "" : ""
        return (
          studentName(s).toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.phone.toLowerCase().includes(q) ||
          promo.toLowerCase().includes(q)
        )
      })
  }, [data.students, query, promoFilter, promoNameById])

  /* per-promotion student counts for the stat cards */
  const promoCounts = useMemo(() =>
    data.settings.promotions.map((p) => ({
      id: p.id,
      name: p.name,
      count: data.students.filter((s) => s.promotionId === p.id).length,
    })),
    [data.settings.promotions, data.students],
  )

  const unassignedCount = data.students.filter((s) => !s.promotionId).length
  const activeCount     = data.students.filter((s) => s.status === "active").length

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit   = (s: Student) => { setEditing(s); setFormOpen(true) }

  const confirmDelete = () => {
    if (toDelete) {
      deleteStudent(toDelete.id)
      toast.success(`${studentName(toDelete)} removed.`)
      setToDelete(null)
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader title="Students" description="Manage everyone enrolled in the promotions.">
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Add student
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-4 p-6">

        {/* Stats — one card per promotion + active */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard icon={Users} label="Total" value={data.students.length} />
          <StatCard icon={UserRound} label="Active" value={activeCount} />
          {promoCounts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPromoFilter(promoFilter === p.id ? "all" : p.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40",
                promoFilter === p.id ? "border-primary ring-1 ring-primary" : "border-border",
              )}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-semibold leading-none text-foreground">{p.count}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{p.name}</p>
              </div>
            </button>
          ))}
          {unassignedCount > 0 && (
            <StatCard icon={UserRound} label="Unassigned" value={unassignedCount} />
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-0 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, phone…"
              className="pl-9"
              aria-label="Search students"
            />
          </div>
          <Select value={promoFilter} onValueChange={(v) => setPromoFilter(v ?? "all")}>
            <SelectTrigger className="w-auto min-w-44" size="sm">
              <SelectValue placeholder="All promotions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All promotions</SelectItem>
              {data.settings.promotions.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
              {unassignedCount > 0 && (
                <SelectItem value="unassigned">Unassigned</SelectItem>
              )}
            </SelectContent>
          </Select>
          {promoFilter !== "all" && (
            <Button variant="ghost" size="sm" onClick={() => setPromoFilter("all")} className="text-muted-foreground">
              Clear filter
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead className="hidden sm:table-cell">Promotion</TableHead>
                <TableHead className="hidden sm:table-cell">Birthday</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    {data.students.length === 0
                      ? "No students yet. Add one or import a JSON file from Settings."
                      : "No students match your search."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => {
                  const promoName = s.promotionId ? promoNameById.get(s.promotionId) : null
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-foreground">{studentName(s)}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{s.email || "—"}</TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{s.phone || "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {promoName ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {promoName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">{formatBirthday(s.birthday)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            s.status === "active"
                              ? "bg-primary/10 text-primary hover:bg-primary/10"
                              : "bg-muted text-muted-foreground hover:bg-muted"
                          }
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label={`Actions for ${studentName(s)}`}
                            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(s)}>
                              <Pencil className="size-4" aria-hidden="true" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setToDelete(s)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <StudentFormDialog open={formOpen} onOpenChange={setFormOpen} student={editing} />

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete student</DialogTitle>
            <DialogDescription>
              {toDelete ? `Are you sure you want to remove ${studentName(toDelete)}? This cannot be undone.` : ""}
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

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-2xl font-semibold leading-none text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
