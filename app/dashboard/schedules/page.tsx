"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Plus, Trash, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

type CycleMaster = {
  _id: string
  title: string
}

type Semester = {
  _id: string
  title: string
}

type Module = {
  _id: string
  title: string
}

type Professor = {
  _id: string
  firstName: string
  lastName: string
}

type DailySchedule = {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"
  sessions: Array<{
    module: string
    professor: string
    timeSlot: string
    place: string
  }>
}

type Schedule = {
  _id: string
  cycleMaster: string
  cycleMasterTitle: string
  semester: string
  semesterTitle: string
  dailySchedules: DailySchedule[]
  schedule_pdf: string | null
}

const TIME_SLOTS = [
  { id: "1", time: "08:30-10:00", label: "8h30 - 10h00" },
  { id: "2", time: "10:15-11:45", label: "10h15 - 11h45" },
  { id: "3", time: "14:00-15:30", label: "14h00 - 15h30" },
  { id: "4", time: "15:45-17:15", label: "15h45 - 17h15" },
  { id: "5", time: "17:30-19:00", label: "17h30 - 19h00" },
] as const

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [cycleMasters, setCycleMasters] = useState<CycleMaster[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [professors, setProfessors] = useState<Professor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false)
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    cycleMaster: "",
    semester: "",
    dailySchedules: DAYS_OF_WEEK.map((day) => ({
      day,
      sessions: [],
    })),
  })
  const [activeDay, setActiveDay] = useState<string>("Monday")
  const [timeConflicts, setTimeConflicts] = useState<{ [key: string]: boolean }>({})
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [schedulesRes, cycleMastersRes, semestersRes, modulesRes, professorsRes] = await Promise.all([
          fetch("/api/schedules"),
          fetch("/api/cycle-masters"),
          fetch("/api/semesters"),
          fetch("/api/modules"),
          fetch("/api/professors"),
        ])
        const [schedulesData, cycleMastersData, semestersData, modulesData, professorsData] = await Promise.all([
          schedulesRes.json(),
          cycleMastersRes.json(),
          semestersRes.json(),
          modulesRes.json(),
          professorsRes.json(),
        ])

        // Add cycleMasterTitle and semesterTitle to each schedule
        const updatedSchedules = schedulesData.map((schedule: Schedule) => ({
          ...schedule,
          cycleMasterTitle:
            cycleMastersData.find((cm: CycleMaster) => cm._id === schedule.cycleMaster)?.title || "Cycle inconnu",
          semesterTitle: semestersData.find((s: Semester) => s._id === schedule.semester)?.title || "Semestre inconnu",
        }))

        setSchedules(updatedSchedules)
        setCycleMasters(cycleMastersData)
        setSemesters(semestersData)
        setModules(modulesData)
        setProfessors(professorsData)
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les données. Veuillez réessayer.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSchedule.cycleMaster || !newSchedule.semester) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un cycle master et un semestre.",
        variant: "destructive",
      })
      return
    }
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
          cycleMaster: "",
          semester: "",
          dailySchedules: DAYS_OF_WEEK.map((day) => ({ day, sessions: [] })),
        })
        toast({
          title: "Succès",
          description: "Emploi du temps ajouté avec succès",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de l'ajout de l'emploi du temps")
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'emploi du temps:", error)
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Erreur lors de l'ajout de l'emploi du temps. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  // Function to check if a time slot is available
  const isTimeSlotAvailable = (day: string, timeSlot: string) => {
    const daySchedule = newSchedule.dailySchedules?.find((s) => s.day === day)
    return !daySchedule?.sessions.some((session) => session.timeSlot === timeSlot)
  }

  // Function to add a session to a day
  const addSession = (day: string) => {
    setNewSchedule((prev) => ({
      ...prev,
      dailySchedules:
        prev.dailySchedules?.map((schedule) =>
          schedule.day === day
            ? {
                ...schedule,
                sessions: [...schedule.sessions, { module: "", professor: "", timeSlot: "", place: "" }],
              }
            : schedule,
        ) || [],
    }))
  }

  // Function to remove a session
  const removeSession = (day: string, sessionIndex: number) => {
    setNewSchedule((prev) => ({
      ...prev,
      dailySchedules:
        prev.dailySchedules?.map((schedule) =>
          schedule.day === day
            ? {
                ...schedule,
                sessions: schedule.sessions.filter((_, index) => index !== sessionIndex),
              }
            : schedule,
        ) || [],
    }))
  }

  // Function to update a session
  const updateSession = (
    day: string,
    sessionIndex: number,
    field: keyof DailySchedule["sessions"][0],
    value: string,
  ) => {
    setNewSchedule((prev) => ({
      ...prev,
      dailySchedules:
        prev.dailySchedules?.map((schedule) =>
          schedule.day === day
            ? {
                ...schedule,
                sessions: schedule.sessions.map((session, index) =>
                  index === sessionIndex ? { ...session, [field]: value } : session,
                ),
              }
            : schedule,
        ) || [],
    }))
  }

  const handleDownload = (pdfUrl: string | null) => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank")
    } else {
      toast({
        title: "Erreur",
        description: "Aucun fichier PDF trouvé pour cet emploi du temps.",
        // variant: "warning",
      })
    }
  }

  const getDayScheduleStatus = (day: string) => {
    const schedule = newSchedule.dailySchedules?.find((s) => s.day === day)
    if (!schedule || schedule.sessions.length === 0) return "empty"
    if (schedule.sessions.every((session) => session.module && session.professor && session.timeSlot && session.place))
      return "complete"
    return "incomplete"
  }

  const openScheduleDetails = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
  }

  const getModuleTitle = (moduleId: string) => {
    const module = modules.find((m) => m._id === moduleId)
    return module ? module.title : "Module inconnu"
  }

  const getProfessorName = (professorId: string) => {
    const professor = professors.find((p) => p._id === professorId)
    return professor ? `${professor.firstName} ${professor.lastName}` : "Professeur inconnu"
  }

  const ScheduleList = ({ schedules }: { schedules: Schedule[] }) => {
    const groupedSchedules = schedules.reduce(
      (acc, schedule) => {
        if (!acc[schedule.cycleMaster]) {
          acc[schedule.cycleMaster] = {}
        }
        acc[schedule.cycleMaster][schedule.semester] = schedule
        return acc
      },
      {} as Record<string, Record<string, Schedule>>,
    )

    return (
      <div className="space-y-6">
        {Object.entries(groupedSchedules).map(([cycleMasterId, semesters]) => (
          <Card key={cycleMasterId}>
            <CardHeader>
              <CardTitle>{Object.values(semesters)[0].cycleMasterTitle}</CardTitle>
              <CardDescription>{Object.keys(semesters).length} semestres</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.values(semesters).map((schedule) => (
                  <div key={schedule._id} className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      className="w-full justify-start mr-2"
                      onClick={() => openScheduleDetails(schedule)}
                    >
                      {schedule.semesterTitle}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDownload(schedule.schedule_pdf)}
                      disabled={!schedule.schedule_pdf}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const ScheduleDetailsDialog = ({ schedule, onClose }: { schedule: Schedule | null; onClose: () => void }) => {
    if (!schedule) return null

    return (
      <Dialog open={!!schedule} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {schedule.cycleMasterTitle} - {schedule.semesterTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jour</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Professeur</TableHead>
                  <TableHead>Horaire</TableHead>
                  <TableHead>Salle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.dailySchedules.map((daily) => (
                  <TableRow key={daily.day}>
                    <TableCell className="font-medium">{daily.day}</TableCell>
                    <TableCell>
                      {daily.sessions.map((session, index) => (
                        <div key={index}>{getModuleTitle(session.module)}</div>
                      ))}
                    </TableCell>
                    <TableCell>
                      {daily.sessions.map((session, index) => (
                        <div key={index}>{getProfessorName(session.professor)}</div>
                      ))}
                    </TableCell>
                    <TableCell>
                      {daily.sessions.map((session, index) => (
                        <div key={index}>{session.timeSlot}</div>
                      ))}
                    </TableCell>
                    <TableCell>
                      {daily.sessions.map((session, index) => (
                        <div key={index}>{session.place}</div>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={() => handleDownload(schedule.schedule_pdf)} disabled={!schedule.schedule_pdf}>
              <Download className="mr-2 h-4 w-4" /> Télécharger PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un Nouvel Emploi du Temps</DialogTitle>
              <DialogDescription>Remplissez les informations pour ajouter un nouvel emploi du temps.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSchedule}>
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cycleMaster">Cycle Master</Label>
                    <Select
                      value={newSchedule.cycleMaster}
                      onValueChange={(value) => setNewSchedule({ ...newSchedule, cycleMaster: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un cycle master" />
                      </SelectTrigger>
                      <SelectContent>
                        {cycleMasters.map((cycleMaster) => (
                          <SelectItem key={cycleMaster._id} value={cycleMaster._id}>
                            {cycleMaster.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="semester">Semestre</Label>
                    <Select
                      value={newSchedule.semester}
                      onValueChange={(value) => setNewSchedule({ ...newSchedule, semester: value })}
                    >
                      <SelectTrigger>
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
                </div>

                <Tabs defaultValue="Monday" className="w-full">
                  <TabsList className="grid grid-cols-7 h-auto">
                    {DAYS_OF_WEEK.map((day) => (
                      <TabsTrigger key={day} value={day} className="relative">
                        {day}
                        <Badge
                          variant={getDayScheduleStatus(day) === "complete" ? "default" : "secondary"}
                          className="absolute -top-2 -right-2 h-2 w-2 p-0"
                        />
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {DAYS_OF_WEEK.map((day) => (
                    <TabsContent key={day} value={day} className="border rounded-lg p-4 mt-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">{day}</h3>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addSession(day)}
                            disabled={newSchedule.dailySchedules?.find((s) => s.day === day)?.sessions.length === 5}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Ajouter une séance
                          </Button>
                        </div>

                        {newSchedule.dailySchedules
                          ?.find((s) => s.day === day)
                          ?.sessions.map((session, sessionIndex) => (
                            <Card key={sessionIndex}>
                              <CardHeader className="p-4">
                                <div className="flex justify-between items-center">
                                  <CardTitle className="text-base">Séance {sessionIndex + 1}</CardTitle>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSession(day, sessionIndex)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Module</Label>
                                    <Select
                                      value={session.module}
                                      onValueChange={(value) => updateSession(day, sessionIndex, "module", value)}
                                    >
                                      <SelectTrigger>
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

                                  <div>
                                    <Label>Professeur</Label>
                                    <Select
                                      value={session.professor}
                                      onValueChange={(value) => updateSession(day, sessionIndex, "professor", value)}
                                      disabled={!session.module}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un professeur" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {professors.map((professor) => (
                                          <SelectItem key={professor._id} value={professor._id}>
                                            {`${professor.firstName} ${professor.lastName}`}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label>Horaire</Label>
                                    <Select
                                      value={session.timeSlot}
                                      onValueChange={(value) => updateSession(day, sessionIndex, "timeSlot", value)}
                                      disabled={!session.module}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un horaire" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {TIME_SLOTS.map((slot) => (
                                          <SelectItem
                                            key={slot.id}
                                            value={slot.time}
                                            disabled={!isTimeSlotAvailable(day, slot.time)}
                                          >
                                            {slot.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label>Salle</Label>
                                    <Input
                                      value={session.place}
                                      onChange={(e) => updateSession(day, sessionIndex, "place", e.target.value)}
                                      placeholder="Ex: Salle 21"
                                      disabled={!session.module}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}

                        {!newSchedule.dailySchedules?.find((s) => s.day === day)?.sessions.length && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Clock className="mx-auto h-12 w-12 mb-2 opacity-50" />
                            <p>Aucune séance programmée</p>
                            <p className="text-sm">Cliquez sur "Ajouter une séance" pour commencer</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <Card>
                  <CardHeader>
                    <CardTitle>Résumé de l'emploi du temps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {DAYS_OF_WEEK.map((day) => {
                        const schedule = newSchedule.dailySchedules?.find((s) => s.day === day)

                        return (
                          <div key={day} className="flex flex-col gap-2 py-2 border-b last:border-0">
                            <span className="font-medium">{day}</span>
                            {schedule?.sessions.length ? (
                              <div className="grid gap-1">
                                {schedule.sessions.map((session, index) => {
                                  const module = modules.find((m) => m._id === session.module)
                                  const professor = professors.find((p) => p._id === session.professor)
                                  const timeSlot = TIME_SLOTS.find((t) => t.time === session.timeSlot)

                                  return (
                                    <div
                                      key={index}
                                      className="text-sm text-muted-foreground pl-4 border-l-2 border-muted"
                                    >
                                      {module?.title ? (
                                        <>
                                          {module.title} -{" "}
                                          {professor ? `${professor.firstName} ${professor.lastName}` : "Non assigné"}
                                          {timeSlot ? ` (${timeSlot.label})` : ""}
                                          {session.place ? ` - ${session.place}` : ""}
                                        </>
                                      ) : (
                                        <span className="italic">Session non configurée</span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Aucune séance</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit">Ajouter l'Emploi du Temps</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Emplois du Temps</CardTitle>
          <CardDescription>Liste de tous les emplois du temps par cycle.</CardDescription>
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

      <ScheduleDetailsDialog schedule={selectedSchedule} onClose={() => setSelectedSchedule(null)} />
    </div>
  )
}

