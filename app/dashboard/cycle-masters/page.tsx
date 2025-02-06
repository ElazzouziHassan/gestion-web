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
import { Plus, Upload } from "lucide-react"
import * as XLSX from "xlsx"

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
      const response = await fetch("/api/cycle-masters")
      if (response.ok) {
        const data = await response.json()
        setCycleMasters(data)
      } else {
        const errorText = await response.text()
        console.error("Error fetching cycle masters:", response.status, response.statusText, errorText)
      }
    } catch (error) {
      console.error("Error fetching cycle masters:", error)
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
      if (response.ok) {
        setIsAddCycleMasterOpen(false)
        fetchCycleMasters()
        setNewCycleMaster({
          title: "",
          major: "",
          description: "",
          duration: 0, // Changed to number
        })
      } else {
        console.error("Error adding cycle master:", response.statusText)
      }
    } catch (error) {
      console.error("Error adding cycle master:", error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        for (const row of jsonData) {
          try {
            await fetch("/api/cycle-masters", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(row),
            })
          } catch (error) {
            console.error("Error adding cycle master from Excel:", error)
          }
        }

        fetchCycleMasters()
      }
      reader.readAsArrayBuffer(file)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des Cycles Master</h1>
        <div className="space-x-2">
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
                      } // Parse as integer
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

