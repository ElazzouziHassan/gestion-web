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
import { MultiSelect } from "@/components/ui/multi-select"
import { Plus, Upload, MoreHorizontal } from "lucide-react"
import * as XLSX from "xlsx"
import { useToast } from "@/hooks/use-toast"

type Professor = {
  _id: string
  firstName: string
  lastName: string
  email: string
  telephone: string
  status: "permanent" | "vacataire"
  modules: string[]
}

type Module = {
  _id: string
  title: string
}

export default function ProfessorsPage() {
  const [professors, setProfessors] = useState<Professor[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [isAddProfessorOpen, setIsAddProfessorOpen] = useState(false)
  const [newProfessor, setNewProfessor] = useState({
    firstName: "",
    lastName: "",
    email: "",
    telephone: "",
    status: "vacataire",
    moduleIds: [] as string[],
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchProfessors()
    fetchModules()
  }, [])

  const fetchProfessors = async () => {
    try {
      const response = await fetch("/api/professors")
      if (response.ok) {
        const data = await response.json()
        setProfessors(data)
      } else {
        throw new Error("Failed to fetch professors")
      }
    } catch (error) {
      console.error("Error fetching professors:", error)
      toast({
        title: "Error",
        description: "Failed to fetch professors. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchModules = async () => {
    try {
      const response = await fetch("/api/modules")
      if (response.ok) {
        const data = await response.json()
        setModules(data)
      } else {
        throw new Error("Failed to fetch modules")
      }
    } catch (error) {
      console.error("Error fetching modules:", error)
      toast({
        title: "Error",
        description: "Failed to fetch modules. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddProfessor = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/professors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProfessor),
      })
      if (response.ok) {
        setIsAddProfessorOpen(false)
        fetchProfessors()
        setNewProfessor({
          firstName: "",
          lastName: "",
          email: "",
          telephone: "",
          status: "vacataire",
          moduleIds: [],
        })
        toast({
          title: "Success",
          description: "Professor added successfully.",
        })
      } else {
        throw new Error("Failed to add professor")
      }
    } catch (error) {
      console.error("Error adding professor:", error)
      toast({
        title: "Error",
        description: "Failed to add professor. Please try again.",
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
            await fetch("/api/professors", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(row),
            })
          }

          fetchProfessors()
          toast({
            title: "Success",
            description: "Professors imported successfully.",
          })
        } catch (error) {
          console.error("Error processing Excel file:", error)
          toast({
            title: "Error",
            description: "Failed to process Excel file. Please check the file format and try again.",
            variant: "destructive",
          })
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des Professeurs</h1>
        <div className="space-x-2">
          <Dialog open={isAddProfessorOpen} onOpenChange={setIsAddProfessorOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un Professeur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un Nouveau Professeur</DialogTitle>
                <DialogDescription>Remplissez les informations du professeur ci-dessous.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddProfessor}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        value={newProfessor.firstName}
                        onChange={(e) => setNewProfessor({ ...newProfessor, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        value={newProfessor.lastName}
                        onChange={(e) => setNewProfessor({ ...newProfessor, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newProfessor.email}
                      onChange={(e) => setNewProfessor({ ...newProfessor, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      value={newProfessor.telephone}
                      onChange={(e) => setNewProfessor({ ...newProfessor, telephone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Statut</Label>
                    <Select
                      value={newProfessor.status}
                      onValueChange={(value) =>
                        setNewProfessor({ ...newProfessor, status: value as "permanent" | "vacataire" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="permanent">Permanent</SelectItem>
                        <SelectItem value="vacataire">Vacataire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="modules">Modules</Label>
                    <MultiSelect
                      options={modules.map((module) => ({ label: module.title, value: module._id }))}
                      selected={newProfessor.moduleIds}
                      onChange={(selected) => setNewProfessor({ ...newProfessor, moduleIds: selected })}
                      placeholder="Sélectionnez les modules"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Ajouter le Professeur</Button>
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
      {professors.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professors.map((professor) => (
              <TableRow key={professor._id}>
                <TableCell>{`${professor.firstName} ${professor.lastName}`}</TableCell>
                <TableCell>{professor.email}</TableCell>
                <TableCell>{professor.telephone}</TableCell>
                <TableCell>{professor.status}</TableCell>
                <TableCell>{"List des mosule sera affiché ici"}</TableCell>
                {/* <TableCell>{professor.modules.join(", ")}</TableCell> */}
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
          <p className="text-xl text-gray-500">Aucun professeur disponible.</p>
          <p className="text-sm text-gray-400 mt-2">Ajoutez un nouveau professeur pour commencer.</p>
        </div>
      )}
    </div>
  )
}

