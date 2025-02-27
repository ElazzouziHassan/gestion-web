"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Upload, MoreHorizontal, FileDown } from "lucide-react"
import * as XLSX from "xlsx"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

type Semester = {
  _id: string
  title: string
  cycleName: string
  startDate: string
  endDate: string
}

type CycleMaster = {
  _id: string
  title: string
}

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [cycleMasters, setCycleMasters] = useState<CycleMaster[]>([])
  const [isAddSemesterOpen, setIsAddSemesterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newSemester, setNewSemester] = useState({
    title: "",
    cycleId: "",
    startDate: "",
    endDate: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchSemesters()
    fetchCycleMasters()
  }, [])

  const fetchSemesters = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/semesters")
      if (!response.ok) throw new Error("Failed to fetch semesters")
      const data = await response.json()
      setSemesters(data)
    } catch (error) {
      console.error("Error fetching semesters:", error)
      toast({
        title: "Error",
        description: "Failed to fetch semesters. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCycleMasters = async () => {
    try {
      const response = await fetch("/api/cycle-masters")
      if (!response.ok) throw new Error("Failed to fetch cycle masters")
      const data = await response.json()
      setCycleMasters(data)
    } catch (error) {
      console.error("Error fetching cycle masters:", error)
      toast({
        title: "Error",
        description: "Failed to fetch cycle masters. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddSemester = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/semesters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSemester),
      })
      if (!response.ok) throw new Error("Failed to add semester")

      setIsAddSemesterOpen(false)
      fetchSemesters()
      setNewSemester({
        title: "",
        cycleId: "",
        startDate: "",
        endDate: "",
      })
      toast({
        title: "Success",
        description: "Semester added successfully.",
      })
    } catch (error) {
      console.error("Error adding semester:", error)
      toast({
        title: "Error",
        description: "Failed to add semester. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          for (const row of jsonData) {
            await fetch("/api/semesters", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(row),
            })
          }

          fetchSemesters()
          toast({
            title: "Success",
            description: "Semesters imported successfully.",
          })
        } catch (error) {
          console.error("Error processing Excel file:", error)
          toast({
            title: "Error",
            description: "Failed to process Excel file. Please check the format and try again.",
            variant: "destructive",
          })
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const handleDownload = async (format: "pdf" | "excel") => {
    try {
      const response = await fetch(`/api/semesters/download?format=${format}`)
      if (!response.ok) throw new Error(`Échec du téléchargement du fichier ${format.toUpperCase()}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `liste_semestres.${format === "pdf" ? "pdf" : "xlsx"}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      toast({
        title: "Succès",
        description: `Liste des semestres téléchargée en ${format.toUpperCase()}.`,
      })
    } catch (error) {
      console.error(`Erreur lors du téléchargement de la liste des semestres en ${format.toUpperCase()}:`, error)
      toast({
        title: "Erreur",
        description: `Impossible de télécharger la liste des semestres en ${format.toUpperCase()}. Veuillez réessayer.`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des Semestres</h1>
        <div className="flex gap-2">
          <Dialog open={isAddSemesterOpen} onOpenChange={setIsAddSemesterOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un Semestre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un Nouveau Semestre</DialogTitle>
                <DialogDescription>Remplissez les informations du semestre ci-dessous.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSemester}>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="title">Titre du Semestre</Label>
                    <Input
                      id="title"
                      value={newSemester.title}
                      onChange={(e) => setNewSemester({ ...newSemester, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cycleId">Cycle Master</Label>
                    <Select
                      value={newSemester.cycleId}
                      onValueChange={(value) => setNewSemester({ ...newSemester, cycleId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un cycle" />
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
                  <div>
                    <Label htmlFor="startDate">Date de début</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newSemester.startDate}
                      onChange={(e) => setNewSemester({ ...newSemester, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Date de fin</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newSemester.endDate}
                      onChange={(e) => setNewSemester({ ...newSemester, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Ajouter le Semestre</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Télécharger la liste
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleDownload("pdf")}>Télécharger en PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload("excel")}>Télécharger en Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex items-center space-x-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md">
              <Upload className="h-5 w-5" />
              <span>Importer Excel</span>
            </div>
            <Input id="file-upload" type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </Label>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">Chargement des semestres...</p>
        </div>
      ) : semesters.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Date de début</TableHead>
              <TableHead>Date de fin</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {semesters.map((semester) => (
              <TableRow key={semester._id}>
                <TableCell>{semester.title}</TableCell>
                <TableCell>{semester.cycleName}</TableCell>
                <TableCell>{new Date(semester.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(semester.endDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">Aucun semestre disponible.</p>
          <p className="text-sm text-gray-400 mt-2">Ajoutez un nouveau semestre pour commencer.</p>
        </div>
      )}
    </div>
  )
}

