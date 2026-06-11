"use client"

import { useRef, useState } from "react"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import type { Promotion } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import type { ImportPayload } from "@/lib/types"
import {
  Download,
  FileJson,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const SAMPLE: ImportPayload = {
  classes: [
    { id: "cl-1", name: "Foundations of Faith", order: 0, description: "Introductory class." },
    { id: "cl-2", name: "Life of Christ", order: 1, description: "The ministry of Jesus." },
  ],
  lessons: [
    { id: "ls-1", classId: "cl-1", title: "Who is God?", order: 0, description: "The nature of God.", reference: "Genesis 1:1" },
    { id: "ls-2", classId: "cl-1", title: "The Bible", order: 1, description: "God's Word.", reference: "2 Timothy 3:16" },
    { id: "ls-3", classId: "cl-2", title: "The Birth of Jesus", order: 0, description: "The incarnation.", reference: "Luke 2" },
  ],
  students: [],
}

function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/* ── Promotion form (inline add / edit) ── */

function PromotionForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Promotion>
  onSave: (name: string, startDate: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [startDate, setStartDate] = useState(initial?.scheduleStartDate ?? "")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !startDate) return
    onSave(name.trim(), startDate)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pf-name">Promotion name</Label>
        <Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Promotion 2026–2027" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pf-date">Schedule start date</Label>
        <Input id="pf-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        <p className="text-xs text-muted-foreground">Generation begins on the first Friday on or after this date.</p>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="gap-2">
          <Save className="size-4" aria-hidden="true" />
          {initial?.id ? "Save changes" : "Add promotion"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} className="gap-2">
          <X className="size-4" aria-hidden="true" />
          Cancel
        </Button>
      </div>
    </form>
  )
}

/* ── Main page ── */

export default function SettingsPage() {
  const { data, addPromotion, updatePromotion, deletePromotion, regenerate, importData, exportData, resetAll, loadSeed } = useStore()
  const { username, changeCredentials } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [addingPromo, setAddingPromo]   = useState(false)
  const [editingId, setEditingId]       = useState<string | null>(null)

  const [newUser, setNewUser] = useState(username)
  const [newPass, setNewPass] = useState("")

  const handleAddPromotion = (name: string, startDate: string) => {
    addPromotion({ name, scheduleStartDate: startDate })
    toast.success("Promotion added and schedule generated.")
    setAddingPromo(false)
  }

  const handleUpdatePromotion = (id: string, name: string, startDate: string) => {
    updatePromotion(id, { name, scheduleStartDate: startDate })
    toast.success("Promotion updated.")
    setEditingId(null)
  }

  const handleDeletePromotion = (p: Promotion) => {
    if (data.settings.promotions.length <= 1) {
      toast.error("You must keep at least one promotion.")
      return
    }
    if (!confirm(`Delete "${p.name}" and all its calendar events?`)) return
    deletePromotion(p.id)
    toast.success("Promotion deleted.")
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const payload = JSON.parse(text) as ImportPayload
      const counts = importData(payload)
      toast.success(`Imported ${counts.students} students, ${counts.classes} classes, ${counts.lessons} lessons.`)
    } catch {
      toast.error("Could not parse that file. Make sure it is valid JSON.")
    } finally {
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const saveCreds = () => {
    if (!newUser.trim()) { toast.error("Username cannot be empty."); return }
    if (!newPass) { toast.error("Enter a new password."); return }
    changeCredentials({ username: newUser.trim(), password: newPass })
    setNewPass("")
    toast.success("Admin credentials updated.")
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Settings & Import"
        description="Manage promotions, import data, and configure admin access."
      />

      <div className="grid gap-6 p-6 lg:grid-cols-2">

        {/* ── Promotions ── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <RefreshCw className="size-4 text-primary" aria-hidden="true" />
                  Promotions
                </CardTitle>
                <CardDescription className="mt-1">
                  Each promotion generates its own academic schedule (Fri/Sat lessons, Sunday fellowships, crusades). Classes and lessons are shared across all promotions.
                </CardDescription>
              </div>
              {!addingPromo && (
                <Button size="sm" onClick={() => { setAddingPromo(true); setEditingId(null) }} className="shrink-0 gap-2">
                  <Plus className="size-4" aria-hidden="true" />
                  Add promotion
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {/* Promotion list */}
            {data.settings.promotions.map((p) => (
              <div key={p.id}>
                {editingId === p.id ? (
                  <PromotionForm
                    initial={p}
                    onSave={(name, startDate) => handleUpdatePromotion(p.id, name, startDate)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className={cn(
                    "flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3",
                  )}>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Starts {p.scheduleStartDate}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost" size="icon" className="size-8"
                        onClick={() => { setEditingId(p.id); setAddingPromo(false) }}
                        aria-label="Edit promotion"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeletePromotion(p)}
                        aria-label="Delete promotion"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add form */}
            {addingPromo && (
              <PromotionForm
                onSave={handleAddPromotion}
                onCancel={() => setAddingPromo(false)}
              />
            )}

            {/* Regenerate button */}
            <div className="mt-1">
              <Button variant="outline" onClick={() => { regenerate(); toast.success("Schedule regenerated.") }} className="gap-2">
                <RefreshCw className="size-4" aria-hidden="true" />
                Regenerate all schedules
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Import / Export ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileJson className="size-4 text-primary" aria-hidden="true" />
              Data Import &amp; Export
            </CardTitle>
            <CardDescription>
              Import students, classes, and lessons. Classes and lessons are shared by all promotions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} className="hidden" />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => fileRef.current?.click()} className="gap-2">
                <Upload className="size-4" aria-hidden="true" />
                Import JSON
              </Button>
              <Button variant="outline" onClick={() => downloadJSON("bible-study-template.json", SAMPLE)} className="gap-2">
                <Download className="size-4" aria-hidden="true" />
                Download template
              </Button>
              <Button variant="outline" onClick={() => downloadJSON("bible-study-backup.json", exportData())} className="gap-2">
                <Download className="size-4" aria-hidden="true" />
                Export all data
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{data.settings.promotions.length}</span> promotion(s) ·{" "}
                <span className="font-medium text-foreground">{data.students.length}</span> students ·{" "}
                <span className="font-medium text-foreground">{data.classes.length}</span> classes ·{" "}
                <span className="font-medium text-foreground">{data.lessons.length}</span> lessons ·{" "}
                <span className="font-medium text-foreground">{data.events.length}</span> events
              </p>
            </div>
            <Button variant="outline" onClick={() => { loadSeed(); toast.success("Sample data loaded.") }} className="gap-2">
              <Sparkles className="size-4" aria-hidden="true" />
              Load sample data
            </Button>
          </CardContent>
        </Card>

        {/* ── Admin credentials ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4 text-primary" aria-hidden="true" />
              Admin Access
            </CardTitle>
            <CardDescription>Update the administrator username and password.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="user">Username</Label>
              <Input id="user" value={newUser} onChange={(e) => setNewUser(e.target.value)} autoComplete="username" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pass">New password</Label>
              <Input id="pass" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Enter a new password" autoComplete="new-password" />
            </div>
            <Button onClick={saveCreds} className="gap-2 self-start">
              <Save className="size-4" aria-hidden="true" />
              Update credentials
            </Button>
          </CardContent>
        </Card>

        {/* ── Danger zone ── */}
        <Card className="border-destructive/30 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <Trash2 className="size-4" aria-hidden="true" />
              Reset
            </CardTitle>
            <CardDescription>Permanently delete all data including all promotions, students, classes, lessons, meetings, and events.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("This will erase ALL data including all promotions. Continue?")) {
                  resetAll()
                  toast.success("All data cleared.")
                }
              }}
              className="gap-2"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Clear all data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
