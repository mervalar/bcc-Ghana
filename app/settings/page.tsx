"use client"

import { useEffect, useRef, useState } from "react"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import type { ImportPayload, Promotion } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { BookOpen, CalendarRange, KeyRound, Pencil, Plus, Save, Trash2, Upload, Users, X } from "lucide-react"
import { parseCSV } from "@/lib/csv"

type StudentRow = NonNullable<ImportPayload["students"]>[number]

/* ── Promotion dialog ── */

function PromotionDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  initial?: Promotion
  onSave: (name: string, startDate: string, students: StudentRow[]) => void
}) {
  const [name, setName]           = useState("")
  const [startDate, setStartDate] = useState("")
  const [students, setStudents]   = useState<StudentRow[]>([])
  const [fileName, setFileName]   = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "")
      setStartDate(initial?.scheduleStartDate ?? "")
      setStudents([])
      setFileName("")
    }
  }, [open, initial?.id])

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const isCSV = file.name.toLowerCase().endsWith(".csv")
      let parsed: StudentRow[]
      if (isCSV) {
        parsed = parseCSV(text)
        if (!parsed.length) throw new Error("No rows found in CSV.")
      } else {
        const json = JSON.parse(text)
        parsed = Array.isArray(json) ? json : json.students
        if (!Array.isArray(parsed)) throw new Error("Expected a students array.")
      }
      setStudents(parsed)
      setFileName(file.name)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not read the file.")
    }
  }

  const handleSave = () => {
    if (!name.trim() || !startDate) return
    onSave(name.trim(), startDate, students)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit promotion" : "New promotion"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pd-name">Promotion name</Label>
            <Input id="pd-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Promotion 2026–2027" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="pd-date">Schedule start date</Label>
            <Input id="pd-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">Lessons begin on the first Friday on or after this date.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Import students <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <input ref={fileRef} type="file" accept="application/json,.json,.csv,text/csv" onChange={onFile} className="hidden" />
            {students.length === 0 ? (
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-2 self-start">
                <Upload className="size-4" aria-hidden="true" />
                Choose file (CSV or JSON)
              </Button>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                <Users className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                  <span className="font-semibold">{students.length}</span> student{students.length !== 1 ? "s" : ""} — {fileName}
                </span>
                <button type="button" onClick={() => { setStudents([]); setFileName(""); if (fileRef.current) fileRef.current.value = "" }} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Remove file">
                  <X className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || !startDate} className="gap-2">
            <Save className="size-4" aria-hidden="true" />
            {initial ? "Save changes" : "Add promotion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Admin dialog ── */

function AdminDialog({
  open,
  onOpenChange,
  currentUsername,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  currentUsername: string
  onSave: (username: string, password: string) => void
}) {
  const [newUser, setNewUser] = useState(currentUsername)
  const [newPass, setNewPass] = useState("")

  useEffect(() => {
    if (open) { setNewUser(currentUsername); setNewPass("") }
  }, [open, currentUsername])

  const handleSave = () => {
    if (!newUser.trim()) { toast.error("Username cannot be empty."); return }
    if (!newPass) { toast.error("Enter a new password."); return }
    onSave(newUser.trim(), newPass)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change credentials</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ad-user">Username</Label>
            <Input id="ad-user" value={newUser} onChange={(e) => setNewUser(e.target.value)} autoComplete="username" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ad-pass">New password</Label>
            <Input id="ad-pass" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Enter a new password" autoComplete="new-password" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="size-4" aria-hidden="true" />
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Main page ── */

export default function SettingsPage() {
  const {
    data,
    addPromotion, updatePromotion, deletePromotion,
    importStudentsForPromotion, loadClassTemplate,
    resetAll,
  } = useStore()
  const { username, changeCredentials } = useAuth()

  const promoFileRef                    = useRef<HTMLInputElement>(null)
  const [importingPromoId, setImportingPromoId] = useState<string | null>(null)
  const [promoDialogOpen, setPromoDialogOpen]   = useState(false)
  const [editingPromo, setEditingPromo]         = useState<Promotion | null>(null)
  const [adminDialogOpen, setAdminDialogOpen]   = useState(false)

  /* ── Promotion handlers ── */

  const handleSavePromotion = (name: string, startDate: string, students: StudentRow[]) => {
    if (editingPromo) {
      updatePromotion(editingPromo.id, { name, scheduleStartDate: startDate })
      if (students.length > 0) importStudentsForPromotion(editingPromo.id, students)
      toast.success("Promotion updated.")
    } else {
      const id = addPromotion({ name, scheduleStartDate: startDate })
      if (data.classes.length === 0) loadClassTemplate()
      if (students.length > 0) {
        importStudentsForPromotion(id, students)
        toast.success(`Promotion added with ${students.length} student(s) imported.`)
      } else {
        toast.success("Promotion added and schedule generated.")
      }
    }
    setEditingPromo(null)
  }

  const handleDeletePromotion = (p: Promotion) => {
    const studentCount = data.students.filter((s) => s.promotionId === p.id).length
    if (!confirm(`Delete "${p.name}"? This will also remove ${studentCount} student(s) and all its events.`)) return
    deletePromotion(p.id)
    toast.success("Promotion deleted.")
  }

  /* ── Per-promotion student import ── */

  const triggerPromoImport = (promoId: string) => {
    setImportingPromoId(promoId)
    promoFileRef.current?.click()
  }

  const onPromoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !importingPromoId) return
    try {
      const text = await file.text()
      const isCSV = file.name.toLowerCase().endsWith(".csv")
      let students: ImportPayload["students"]
      if (isCSV) {
        students = parseCSV(text)
        if (!students.length) throw new Error("No rows found in CSV.")
      } else {
        const parsed = JSON.parse(text)
        students = Array.isArray(parsed) ? parsed : parsed.students
        if (!Array.isArray(students)) throw new Error("Expected a students array.")
      }
      const count = importStudentsForPromotion(importingPromoId, students)
      const promoName = data.settings.promotions.find((p) => p.id === importingPromoId)?.name ?? ""
      toast.success(`${count} student${count !== 1 ? "s" : ""} imported into "${promoName}".`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read the file.")
    } finally {
      if (promoFileRef.current) promoFileRef.current.value = ""
      setImportingPromoId(null)
    }
  }

  /* ── Render ── */

  return (
    <div className="flex flex-col">
      <PageHeader title="Settings" description="Manage promotions and admin access." />

      <input ref={promoFileRef} type="file" accept="application/json,.json,.csv,text/csv" onChange={onPromoFile} className="hidden" />

      <div className="flex flex-col gap-6 p-6">

        {/* ── Promotions ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarRange className="size-4 text-primary" aria-hidden="true" />
                Promotions
              </CardTitle>
              {data.settings.promotions.length > 0 && (
                <Button size="sm" className="gap-2" onClick={() => { setEditingPromo(null); setPromoDialogOpen(true) }}>
                  <Plus className="size-4" aria-hidden="true" />
                  Add promotion
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {data.settings.promotions.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-14 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                  <CalendarRange className="size-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-foreground">No promotions yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Create your first promotion to start building a schedule.</p>
                </div>
                <Button className="gap-2" onClick={() => { setEditingPromo(null); setPromoDialogOpen(true) }}>
                  <Plus className="size-4" aria-hidden="true" />
                  Add promotion
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.settings.promotions.map((p) => {
                  const studentCount = data.students.filter((s) => s.promotionId === p.id).length
                  const lessonCount  = data.events.filter((e) => e.promotionId === p.id && e.type === "lesson").length
                  return (
                    <div key={p.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{p.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">Starts {p.scheduleStartDate}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <Button
                            variant="ghost" size="icon" className="size-8"
                            onClick={() => { setEditingPromo(p); setPromoDialogOpen(true) }}
                            aria-label="Edit promotion"
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeletePromotion(p)}
                            aria-label="Delete promotion"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="size-3" aria-hidden="true" />
                          {studentCount} student{studentCount !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="size-3" aria-hidden="true" />
                          {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <Button
                        variant="outline" size="sm" className="gap-1.5 self-start text-xs"
                        onClick={() => triggerPromoImport(p.id)}
                        aria-label="Import students into this promotion"
                      >
                        <Upload className="size-3" aria-hidden="true" />
                        Import students
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Admin access ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4 text-primary" aria-hidden="true" />
              Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{username}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setAdminDialogOpen(true)}>
                <Pencil className="size-3.5" aria-hidden="true" />
                Change
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Danger zone ── */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <Trash2 className="size-4" aria-hidden="true" />
              Reset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive" className="gap-2"
              onClick={() => {
                if (confirm("This will erase ALL data including all promotions. Continue?")) {
                  resetAll()
                  toast.success("All data cleared.")
                }
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Clear all data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Dialogs ── */}
      <PromotionDialog
        open={promoDialogOpen}
        onOpenChange={(o) => { setPromoDialogOpen(o); if (!o) setEditingPromo(null) }}
        initial={editingPromo ?? undefined}
        onSave={handleSavePromotion}
      />

      <AdminDialog
        open={adminDialogOpen}
        onOpenChange={setAdminDialogOpen}
        currentUsername={username}
        onSave={(user, pass) => {
          changeCredentials({ username: user, password: pass })
          toast.success("Credentials updated.")
        }}
      />
    </div>
  )
}
