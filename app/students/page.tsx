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

function formatBirthday(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function StudentsPage() {
  const { data, deleteStudent } = useStore()
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [toDelete, setToDelete] = useState<Student | null>(null)

  const classNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of data.classes) map.set(c.id, c.name)
    return map
  }, [data.classes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = [...data.students].sort((a, b) =>
      studentName(a).localeCompare(studentName(b)),
    )
    if (!q) return list
    return list.filter((s) => {
      const cls = s.classId ? classNameById.get(s.classId) ?? "" : ""
      return (
        studentName(s).toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        cls.toLowerCase().includes(q)
      )
    })
  }, [data.students, query, classNameById])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (s: Student) => {
    setEditing(s)
    setFormOpen(true)
  }

  const confirmDelete = () => {
    if (toDelete) {
      deleteStudent(toDelete.id)
      toast.success(`${studentName(toDelete)} removed.`)
      setToDelete(null)
    }
  }

  const activeCount = data.students.filter((s) => s.status === "active").length

  return (
    <div className="flex flex-col">
      <PageHeader title="Students" description="Manage everyone enrolled in the promotion.">
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Add student
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-4 p-6">
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total students" value={data.students.length} icon={Users} />
          <StatCard label="Active" value={activeCount} icon={UserRound} />
          <StatCard label="Classes" value={data.classes.length} icon={UserRound} />
        </div>

        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, phone, class…"
            className="pl-9"
            aria-label="Search students"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead className="hidden sm:table-cell">Class</TableHead>
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
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-foreground">{studentName(s)}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{s.email || "—"}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{s.phone || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {s.classId ? (
                        <span className="text-muted-foreground">{classNameById.get(s.classId) ?? "—"}</span>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
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
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${studentName(s)}`}>
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                          </Button>
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
                ))
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
              {toDelete
                ? `Are you sure you want to remove ${studentName(toDelete)}? This cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: typeof Users
}) {
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
