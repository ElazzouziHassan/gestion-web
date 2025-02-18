"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Plus } from "lucide-react"
import { DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

type CycleMaster = {
  _id: string
  title: string
}

type Session = {
  module: string
  professor: string
  timeSlot: string
  place: string
}

type DailySchedule = {
  day: string
  sessions: Session[]
}

type Schedule = {
  _id: string
  cycleMaster: string
  semester: string
  dailySchedules: DailySchedule[]
  schedule_pdf: string | null
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const TIME_SLOTS = ["08:30-10:00", "10:15-11:45", "14:00-15:30", "15:45-17:15", "17:30-19:00"]

export default function SchedulesPage() {
  const [cycleMasters, setCycleMasters] = useState<CycleMaster[]>([])
  const [selectedCycleMaster, setSelectedCycleMaster] = useState<string | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCycleMasters()
  }, [])

  useEffect(() => {
    if (selectedCycleMaster) {
      fetchSchedules(selectedCycleMaster)
    }
  }, [selectedCycleMaster])

  const fetchCycleMasters = async () => {
    try {
      const response = await fetch("/api/cycle-masters")
      if (!response.ok) throw new Error("Failed to fetch cycle masters")
      const data = await response.json()
      if (Array.isArray(data)) {
        setCycleMasters(data)
        if (data.length > 0) {
          setSelectedCycleMaster(data[0]._id)
        }
      } else {
        throw new Error("Invalid data format for cycle masters")
      }
    } catch (error) {
      console.error("Error fetching cycle masters:", error)
      setError("Impossible de charger les cycles de master. Veuillez réessayer.")
      toast({
        title: "Erreur",
        description: "Impossible de charger les cycles de master. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  const fetchSchedules = async (cycleMasterId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/schedules?cycleMaster=${cycleMasterId}`)
      if (!response.ok) throw new Error("Failed to fetch schedules")
      const data = await response.json()
      if (Array.isArray(data)) {
        setSchedules(data)
      } else {
        throw new Error("Invalid data format for schedules")
      }
    } catch (error) {
      console.error("Error fetching schedules:", error)
      setError("Impossible de charger les emplois du temps. Veuillez réessayer.")
      toast({
        title: "Erreur",
        description: "Impossible de charger les emplois du temps. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = (pdfUrl: string | null) => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank")
    } else {
      toast({
        title: "Erreur",
        description: "Aucun fichier PDF trouvé pour cet emploi du temps.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Emplois du Temps</h1>
          <p className="text-muted-foreground">
            Ici, vous pouvez gérer les emplois du temps pour les étudiants et les professeurs.
          </p>
        </div>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un Emploi du Temps
          </Button>
        </DialogTrigger>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sélectionner un Cycle de Master</CardTitle>
          <CardDescription>Choisissez un cycle de master pour voir ses emplois du temps.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCycleMaster || ""} onValueChange={(value) => setSelectedCycleMaster(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner un cycle de master" />
            </SelectTrigger>
            <SelectContent>
              {cycleMasters.map((cm) => (
                <SelectItem key={cm._id} value={cm._id}>
                  {cm.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emplois du Temps</CardTitle>
          <CardDescription>Liste des emplois du temps pour le cycle de master sélectionné.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Chargement des emplois du temps...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : schedules.length > 0 ? (
            schedules.map((schedule) => (
              <Card key={schedule._id} className="mb-4">
                <CardHeader>
                  <CardTitle>{schedule.semester}</CardTitle>
                  <CardDescription>
                    <Button variant="outline" onClick={() => handleDownload(schedule.schedule_pdf)}>
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger PDF
                    </Button>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jour</TableHead>
                        {TIME_SLOTS.map((slot) => (
                          <TableHead key={slot}>{slot}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedule.dailySchedules.map((day) => (
                        <TableRow key={day.day}>
                          <TableCell>{day.day}</TableCell>
                          {TIME_SLOTS.map((slot) => {
                            const session = day.sessions.find((s) => s.timeSlot === slot)
                            return (
                              <TableCell key={slot}>
                                {session ? (
                                  <div>
                                    <div>{session.module}</div>
                                    <div className="text-sm text-muted-foreground">{session.professor}</div>
                                    <div className="text-sm text-muted-foreground">{session.place}</div>
                                  </div>
                                ) : null}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          ) : (
            <p>Aucun emploi du temps disponible pour ce cycle de master.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

