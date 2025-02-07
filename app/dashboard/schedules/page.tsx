"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Schedule = {
  _id: string
  module: string
  semester: string
  for: string
  timetable: {
    day: string
    time: string
    room: string
  }[]
  schedule_pdf: string
}

type Module = {
  _id: string
  title: string
}

type Semester = {
  _id: string
  title: string
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false)
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    module: "",
    semester: "",
    for: "student",
    timetable: [],
    schedule_pdf: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [schedulesRes, modulesRes, semestersRes] = await Promise.all([
          fetch("/api/schedules"),
          fetch("/api/modules"),
          fetch("/api/semesters"),
        ])
        const [schedulesData, modulesData, semestersData] = await Promise.all([
          schedulesRes.json(),
          modulesRes.json(),
          semestersRes.json(),
        ])
        setSchedules(schedulesData)
        setModules(modulesData)
        setSemesters(semestersData)
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const formData = new FormData()
      formData.append("file", file)
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        const data = await response.json()
        setNewSchedule((prev) => ({ ...prev, schedule_pdf: data.fileUrl }))
      } catch (error) {
        console.error("Erreur lors du téléchargement du fichier:", error)
      }
    }
  }

  const handleAddSchedule = async () => {
    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSchedule),
      })
      if (response.ok) {
        const addedSchedule = await response.json()
        setSchedules((prev) => [...prev, addedSchedule])
        setIsAddScheduleOpen(false)
        setNewSchedule({
          module: "",
          semester: "",
          for: "student",
          timetable: [],
          schedule_pdf: "",
        })
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'emploi du temps:", error)
    }
  }

  const handleDownload = (scheduleUrl: string) => {
    window.open(scheduleUrl, "_blank")
  }

  const ScheduleList = ({ schedules }: { schedules: Schedule[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Module</TableHead>
          <TableHead>Semestre</TableHead>
          <TableHead>Pour</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedules.map((schedule) => (
          <TableRow key={schedule._id}>
            <TableCell>{schedule.module}</TableCell>
            <TableCell>{schedule.semester}</TableCell>
            <TableCell>{schedule.for === "student" ? "Étudiant" : "Professeur"}</TableCell>
            <TableCell>
              <Button onClick={() => handleDownload(schedule.schedule_pdf)}>
                <Download className="mr-2 h-4 w-4" /> Télécharger
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Gestion des Emplois du Temps</h1>
        <p className="mb-4">Ici, vous pouvez gérer les emplois du temps pour les étudiants et les professeurs.</p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Emplois du Temps</h2>
        <Dialog open={isAddScheduleOpen} onOpenChange={setIsAddScheduleOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Ajouter un Emploi du Temps
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un Nouvel Emploi du Temps</DialogTitle>
              <DialogDescription>Remplissez les informations pour ajouter un nouvel emploi du temps.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="module" className="text-right">
                  Module
                </Label>
                <Select
                  value={newSchedule.module}
                  onValueChange={(value) => setNewSchedule({ ...newSchedule, module: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un module" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module._id} value={module._id}>
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="semester" className="text-right">
                  Semestre
                </Label>
                <Select
                  value={newSchedule.semester}
                  onValueChange={(value) => setNewSchedule({ ...newSchedule, semester: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un semestre" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((semester) => (
                      <SelectItem key={semester._id} value={semester._id}>
                        {semester.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="for" className="text-right">
                  Pour
                </Label>
                <Select
                  value={newSchedule.for}
                  onValueChange={(value) => setNewSchedule({ ...newSchedule, for: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Étudiant</SelectItem>
                    <SelectItem value="professor">Professeur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file-upload" className="text-right">
                  Fichier PDF
                </Label>
                <Input id="file-upload" type="file" accept=".pdf" onChange={handleFileUpload} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddSchedule}>Ajouter l'Emploi du Temps</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Emplois du Temps</CardTitle>
          <CardDescription>Liste de tous les emplois du temps.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Chargement des emplois du temps...</p>
          ) : schedules.length > 0 ? (
            <ScheduleList schedules={schedules} />
          ) : (
            <p>Aucun emploi du temps disponible.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

