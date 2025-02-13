"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type CycleMaster = {
  _id: string
  title: string
}

type Semester = {
  _id: string
  title: string
}

export default function DocumentsPage() {
  const [cycleMasters, setCycleMasters] = useState<CycleMaster[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [selectedCycle, setSelectedCycle] = useState<string>("")
  const [selectedSemester, setSelectedSemester] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCycleMasters()
    fetchSemesters()
  }, [])

  const fetchCycleMasters = async () => {
    try {
      const response = await fetch("/api/cycle-masters")
      if (!response.ok) throw new Error("Échec de la récupération des cycles master")
      const data = await response.json()
      setCycleMasters(data)
    } catch (error) {
      console.error("Erreur lors de la récupération des cycles master:", error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les cycles master. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  const fetchSemesters = async () => {
    try {
      const response = await fetch("/api/semesters")
      if (!response.ok) throw new Error("Échec de la récupération des semestres")
      const data = await response.json()
      setSemesters(data)
    } catch (error) {
      console.error("Erreur lors de la récupération des semestres:", error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les semestres. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async () => {
    if (!selectedCycle || !selectedSemester) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un Cycle Master et un Semestre.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/documents/generate?cycleId=${selectedCycle}&semesterId=${selectedSemester}`)
      if (!response.ok) throw new Error("Échec de la génération du document")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = "donnees_cycle_semestre.xlsx"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      toast({
        title: "Succès",
        description: "Document téléchargé avec succès.",
      })
    } catch (error) {
      console.error("Erreur lors du téléchargement du document:", error)
      toast({
        title: "Erreur",
        description: "Échec du téléchargement du document. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Documents</h1>
      <Card>
        <CardHeader>
          <CardTitle>Générer un Rapport Complet</CardTitle>
          <CardDescription>
            Sélectionnez un Cycle Master et un Semestre pour générer un document Excel contenant des informations
            détaillées sur les modules, les étudiants et les professeurs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="cycle-master" className="text-sm font-medium">
              Cycle Master
            </label>
            <Select value={selectedCycle} onValueChange={setSelectedCycle}>
              <SelectTrigger id="cycle-master">
                <SelectValue placeholder="Sélectionner un Cycle Master" />
              </SelectTrigger>
              <SelectContent>
                {cycleMasters.map((cycle) => (
                  <SelectItem key={cycle._id} value={cycle._id}>
                    {cycle.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="semester" className="text-sm font-medium">
              Semestre
            </label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger id="semester">
                <SelectValue placeholder="Sélectionner un Semestre" />
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
          <Button onClick={handleDownload} disabled={isLoading || !selectedCycle || !selectedSemester}>
            <Download className="mr-2 h-4 w-4" />
            {isLoading ? "Génération en cours..." : "Générer et Télécharger le Rapport"}
          </Button>
          <p className="text-sm text-gray-500">
            Le fichier Excel généré inclura des informations détaillées sur les modules, les étudiants inscrits et les
            professeurs enseignants pour le Cycle Master et le Semestre sélectionnés.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

