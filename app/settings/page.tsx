"use client"

import { useRef, useState } from "react"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import type { ImportPayload } from "@/lib/types"
import { Download, FileJson, RefreshCw, Save, Trash2, Upload, KeyRound, Sparkles } from "lucide-react"

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
  students: [
    {
      firstName: "Grace",
      lastName: "Mensah",
      email: "grace@example.com",
      phone: "+233 24 111 2222",
      birthday: "2004-09-12",
      classId: "cl-1",
      status: "active",
      notes: "",
    },
  ],
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

export default function SettingsPage() {
  const { data, updateSettings, regenerate, importData, exportData, resetAll, loadSeed } = useStore()
  const { username, changeCredentials } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [promotionName, setPromotionName] = useState(data.settings.promotionName)
  const [startDate, setStartDate] = useState(data.settings.scheduleStartDate)

  const [newUser, setNewUser] = useState(username)
  const [newPass, setNewPass] = useState("")

  const saveSchedule = () => {
    updateSettings({ promotionName, scheduleStartDate: startDate })
    toast.success("Settings saved and schedule regenerated.")
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const payload = JSON.parse(text) as ImportPayload
      const counts = importData(payload)
      toast.success(
        `Imported ${counts.students} students, ${counts.classes} classes, ${counts.lessons} lessons.`,
      )
    } catch {
      toast.error("Could not parse that file. Make sure it is valid JSON.")
    } finally {
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const saveCreds = () => {
    if (!newUser.trim()) {
      toast.error("Username cannot be empty.")
      return
    }
    if (!newPass) {
      toast.error("Enter a new password.")
      return
    }
    changeCredentials({ username: newUser.trim(), password: newPass })
    setNewPass("")
    toast.success("Admin credentials updated.")
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Settings & Import"
        description="Configure the academic year, import your data, and manage admin access."
      />

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        {/* Schedule settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="size-4 text-primary" aria-hidden="true" />
              Academic Schedule
            </CardTitle>
            <CardDescription>
              The schedule auto-generates lessons (Fri &amp; Sat), Sunday fellowships, and crusades from this
              start date.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="promo">Promotion name</Label>
              <Input id="promo" value={promotionName} onChange={(e) => setPromotionName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="start">Schedule start date</Label>
              <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                Generation begins on the first Friday on or after this date.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveSchedule} className="gap-2">
                <Save className="size-4" aria-hidden="true" />
                Save &amp; generate
              </Button>
              <Button variant="outline" onClick={() => { regenerate(); toast.success("Schedule regenerated.") }} className="gap-2">
                <RefreshCw className="size-4" aria-hidden="true" />
                Regenerate
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import / export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileJson className="size-4 text-primary" aria-hidden="true" />
              Data Import &amp; Export
            </CardTitle>
            <CardDescription>
              Import students, classes, and lessons from a JSON file. Download the template to see the format.
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
                Current data: <span className="font-medium text-foreground">{data.students.length}</span> students,{" "}
                <span className="font-medium text-foreground">{data.classes.length}</span> classes,{" "}
                <span className="font-medium text-foreground">{data.lessons.length}</span> lessons,{" "}
                <span className="font-medium text-foreground">{data.events.length}</span> calendar events.
              </p>
            </div>
            <Button variant="outline" onClick={() => { loadSeed(); toast.success("Sample data loaded.") }} className="gap-2">
              <Sparkles className="size-4" aria-hidden="true" />
              Load sample data
            </Button>
          </CardContent>
        </Card>

        {/* Admin credentials */}
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
              <Input
                id="pass"
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Enter a new password"
                autoComplete="new-password"
              />
            </div>
            <Button onClick={saveCreds} className="gap-2 self-start">
              <Save className="size-4" aria-hidden="true" />
              Update credentials
            </Button>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <Trash2 className="size-4" aria-hidden="true" />
              Reset
            </CardTitle>
            <CardDescription>Permanently delete all students, classes, lessons, meetings, and events.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("This will erase all data. Continue?")) {
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
