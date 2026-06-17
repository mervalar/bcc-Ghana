"use client"

import { useCallback, useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileText, Bold, Italic, List, ListOrdered, Heading2, Heading3, Type } from "lucide-react"
import type { AppData } from "@/lib/types"
import { fromISO, toISO } from "@/lib/scheduler"
import { MONTHS } from "@/lib/event-style"
import { cn } from "@/lib/utils"

/* ── helpers ── */

function fmt(iso: string): string {
  const d = fromISO(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

interface PromoStats {
  id: string
  name: string
  startDate: string
  estimatedEnd: string | null
  studentCount: number
  studentNames: string[]
  classesTotal: number
  classesFinished: number
  classesLeft: number
  lessonsTotal: number
  lessonsDone: number
  lessonsLeft: number
}

function buildPromoStats(data: AppData): PromoStats[] {
  return data.settings.promotions.map((promo) => {
    const students = data.students.filter((s) => s.promotionId === promo.id)
    const lessonEvts = data.events.filter((e) => e.promotionId === promo.id && e.type === "lesson")
    const sorted = [...lessonEvts].sort((a, b) => b.date.localeCompare(a.date))

    const classIds = [...new Set(lessonEvts.map((e) => e.classId).filter(Boolean))] as string[]
    let classesFinished = 0
    for (const cid of classIds) {
      const cls = lessonEvts.filter((e) => e.classId === cid)
      if (cls.length > 0 && cls.every((e) => e.status === "done")) classesFinished++
    }

    return {
      id: promo.id,
      name: promo.name,
      startDate: promo.scheduleStartDate,
      estimatedEnd: sorted[0]?.date ?? null,
      studentCount: students.length,
      studentNames: students.map((s) => `${s.firstName} ${s.lastName}`),
      classesTotal: classIds.length,
      classesFinished,
      classesLeft: classIds.length - classesFinished,
      lessonsTotal: lessonEvts.length,
      lessonsDone: lessonEvts.filter((e) => e.status === "done").length,
      lessonsLeft: lessonEvts.filter((e) => e.status !== "done").length,
    }
  })
}

function buildInitialHTML(data: AppData, stats: PromoStats[], today: string): string {
  const totStudents = data.students.length
  const totLessons = data.events.filter((e) => e.type === "lesson").length
  const totDone = data.events.filter((e) => e.type === "lesson" && e.status === "done").length

  const promoBlocks = stats.map((s) => `
    <h2>${s.name}</h2>
    <ul>
      <li><strong>Start Date</strong>${fmt(s.startDate)}</li>
      <li><strong>Estimated End</strong>${s.estimatedEnd ? fmt(s.estimatedEnd) : "—"}</li>
      <li><strong>Students</strong>${s.studentCount}</li>
      <li><strong>Total Classes</strong>${s.classesTotal}</li>
      <li><strong>Classes Finished</strong>${s.classesFinished}</li>
      <li><strong>Classes Left</strong>${s.classesLeft}</li>
      <li><strong>Total Lessons</strong>${s.lessonsTotal}</li>
      <li><strong>Lessons Done</strong>${s.lessonsDone}</li>
      <li><strong>Lessons Left</strong>${s.lessonsLeft}</li>
    </ul>
    ${s.studentNames.length > 0 ? `
    <h3>Students (${s.studentCount})</h3>
    <p>${s.studentNames.join(", ")}</p>` : ""}
  `).join("")

  return `
    <h1>BCC Ghana — Project Report</h1>
    <p><em>Generated on ${fmt(today)} · ${stats.length} promotion${stats.length !== 1 ? "s" : ""}</em></p>

    <h2>Overview</h2>
    <ul>
      <li><strong>Total Promotions</strong>${stats.length}</li>
      <li><strong>Total Students</strong>${totStudents}</li>
      <li><strong>Lessons Done</strong>${totDone}</li>
      <li><strong>Lessons Left</strong>${totLessons - totDone}</li>
    </ul>

    ${promoBlocks}
  `
}

/* ── Toolbar ── */

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex size-8 items-center justify-center rounded-md text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 px-3 py-2">
      <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
        <Bold className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
        <Italic className="size-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })}>
        <Type className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
        <Heading2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>
        <Heading3 className="size-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
        <List className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
        <ListOrdered className="size-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton title="Paragraph" onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")}>
        <span className="text-xs font-medium">¶</span>
      </ToolbarButton>
    </div>
  )
}

/* ── Main dialog ── */

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  data: AppData
}

export function ReportDialog({ open, onOpenChange, data }: Props) {
  const today = toISO(new Date())
  const stats = buildPromoStats(data)
  const contentRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [StarterKit],
    content: buildInitialHTML(data, stats, today),
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none focus:outline-none text-slate-800",
      },
    },
  })

  const downloadPDF = useCallback(async () => {
    const el = contentRef.current
    if (!el) return

    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ])

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    })

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 10
    const imgW = pageW - margin * 2
    const imgH = (canvas.height * imgW) / canvas.width
    const imgData = canvas.toDataURL("image/png")

    let y = margin
    let heightLeft = imgH

    pdf.addImage(imgData, "PNG", margin, y, imgW, imgH)
    heightLeft -= pageH - margin * 2

    while (heightLeft > 0) {
      y = heightLeft - imgH + margin
      pdf.addPage()
      pdf.addImage(imgData, "PNG", margin, y, imgW, imgH)
      heightLeft -= pageH - margin * 2
    }

    pdf.save(`bible-study-report-${today}.pdf`)
  }, [today])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-4 text-primary" aria-hidden="true" />
            Project Report
            <span className="ml-1 text-xs font-normal text-muted-foreground">— edit before downloading</span>
          </DialogTitle>
        </DialogHeader>

        <Toolbar editor={editor} />

        <div className="flex-1 overflow-y-auto bg-slate-100/50 p-6">
          <div ref={contentRef} className="report-content mx-auto max-w-[800px] bg-white p-12 shadow-md border border-slate-200/80 min-h-[1000px] rounded-md">
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button className="gap-2" onClick={downloadPDF}>
            <Download className="size-4" aria-hidden="true" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
