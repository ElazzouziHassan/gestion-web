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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Upload, FileDown } from 'lucide-react'
import * as XLSX from "xlsx"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { generatePDF, generateExcel } from "@/lib/fileGenerators"
import { toast } from "@/hooks/use-toast"

type CycleMaster = {
  _id: string
  title: string
  major: string
  description: string
  duration: number
}

export default function CycleMastersPage() {
  const [cycleMasters, setCycleMasters] = useState<CycleMaster[]>([])
  const [isAddCycleMasterOpen, setIsAddCycleMasterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newCycleMaster, setNewCycleMaster] = useState({
    title: "",
    major: "",
    description: "",
    duration: 0,
  })

  useEffect(() => {
    fetchCycleMasters()
  }, [])

  const fetchCycleMasters = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/cycle-masters", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setCycleMasters(data)
    } catch (e) {
      console.error("Error fetching cycle masters:", e)
      setError("Failed to fetch cycle masters. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCycleMaster = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/cycle-masters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCycleMaster),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      setIsAddCycleMasterOpen(false)
      fetchCycleMasters()
      setNewCycleMaster({
        title: "",
        major: "",
        description: "",
        duration: 0,
      })
    } catch (e) {
      console.error("Error adding cycle master:", e)
      setError("Failed to add cycle master. Please try again.")
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
            await fetch("/api/cycle-masters", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(row),
            })
          }

          fetchCycleMasters()
        } catch (e) {
          console.error("Error processing Excel file:", e)
          setError("Failed to process Excel file. Please check the file format and try again.")
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const handleDownload = async (format: "pdf" | "excel") => {
    try {
      if (format === "pdf") {
        const pdfBlob = await generatePDF(cycleMasters, "Liste des Cycles Master", [
          "Titre",
          "Spécialité",
          "Description",
          "Durée"
        ])
        const url = URL.createObjectURL(pdfBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = "liste_cycles_master.pdf"
        a.click()
      } else if (format === "excel") {
        const excelBlob = await generateExcel(cycleMasters, "Liste des Cycles Master")
        const url = URL.createObjectURL(excelBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = "liste_cycles_master.xlsx"
        a.click()
      }
      toast({
        title: "Succès",
        description: `Liste des cycles master téléchargée en ${format.toUpperCase()}.`,
      })
    } catch (error) {
      console.error(`Erreur lors du téléchargement de la liste des cycles master en ${format.toUpperCase()}:`, error)
      toast({
        title: "Erreur",
        description: `Impossible de télécharger la liste des cycles master en ${format.toUpperCase()}. Veuillez réessayer.`,
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des Cycles Master</h1>
        <div className="flex gap-2">
          <Dialog open={isAddCycleMasterOpen} onOpenChange={setIsAddCycleMasterOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un Cycle Master
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un Nouveau Cycle Master</DialogTitle>
                <DialogDescription>Remplissez les informations du cycle master ci-dessous.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCycleMaster}>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="title">Titre du Cycle Master</Label>
                    <Input
                      id="title"
                      value={newCycleMaster.title}
                      onChange={(e) => setNewCycleMaster({ ...newCycleMaster, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="major">Spécialité</Label>
                    <Input
                      id="major"
                      value={newCycleMaster.major}
                      onChange={(e) => setNewCycleMaster({ ...newCycleMaster, major: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newCycleMaster.description}
                      onChange={(e) => setNewCycleMaster({ ...newCycleMaster, description: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Durée (en années)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newCycleMaster.duration}
                      onChange={(e) =>
                        setNewCycleMaster({ ...newCycleMaster, duration: Number.parseInt(e.target.value, 10) })
                      }
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Ajouter le Cycle Master</Button>
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
      {cycleMasters.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Spécialité</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Durée</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cycleMasters.map((cycleMaster) => (
              <TableRow key={cycleMaster._id}>
                <TableCell>{cycleMaster.title}</TableCell>
                <TableCell>{cycleMaster.major}</TableCell>
                <TableCell>{cycleMaster.description}</TableCell>
                <TableCell>{cycleMaster.duration} années</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">Aucun cycle master disponible.</p>
          <p className="text-sm text-gray-400 mt-2">Ajoutez un nouveau cycle master pour commencer.</p>
        </div>
      )}
    </div>
  )
}
