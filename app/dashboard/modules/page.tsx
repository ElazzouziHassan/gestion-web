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
import { Plus, Upload, MoreHorizontal } from "lucide-react"
import * as XLSX from "xlsx"
import { useToast } from "@/hooks/use-toast"

type Module = {
  _id: string
  title: string
  code: string
  cycleName: string
  semesterName: string
}

type CycleMaster = {
  _id: string
  title: string
}

type Semester = {
  _id: string
  title: string
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [cycleMasters, setCycleMasters] = useState<CycleMaster[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newModule, setNewModule] = useState({
    title: "",
    code: "",
    cycleId: "",
    semesterId: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchModules()
    fetchCycleMasters()
    fetchSemesters()
  }, [])

  const fetchModules = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/modules")
      if (!response.ok) throw new Error("Failed to fetch modules")
      const data = await response.json()
      setModules(data)
    } catch (error) {
      console.error("Error fetching modules:", error)
      toast({
        title: "Error",
        description: "Failed to fetch modules. Please try again.",
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

  const fetchSemesters = async () => {
    try {
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
    }
  }

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newModule),
      })
      if (!response.ok) throw new Error("Failed to add module")

      setIsAddModuleOpen(false)
      fetchModules()
      setNewModule({
        title: "",
        code: "",
        cycleId: "",
        semesterId: "",
      })
      toast({
        title: "Success",
        description: "Module added successfully.",
      })
    } catch (error) {
      console.error("Error adding module:", error)
      toast({
        title: "Error",
        description: "Failed to add module. Please try again.",
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
            await fetch("/api/modules", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(row),
            })
          }

          fetchModules()
          toast({
            title: "Success",
            description: "Modules imported successfully.",
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des Modules</h1>
        <div className="space-x-2">
          <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un Module
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un Nouveau Module</DialogTitle>
                <DialogDescription>Remplissez les informations du module ci-dessous.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddModule}>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="title">Titre du Module</Label>
                    <Input
                      id="title"
                      value={newModule.title}
                      onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">Code du Module</Label>
                    <Input
                      id="code"
                      value={newModule.code}
                      onChange={(e) => setNewModule({ ...newModule, code: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cycleId">Cycle Master</Label>
                    <Select
                      value={newModule.cycleId}
                      onValueChange={(value) => setNewModule({ ...newModule, cycleId: value })}
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
                    <Label htmlFor="semesterId">Semestre</Label>
                    <Select
                      value={newModule.semesterId}
                      onValueChange={(value) => setNewModule({ ...newModule, semesterId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un semestre" />
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
                <DialogFooter>
                  <Button type="submit">Ajouter le Module</Button>
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

      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">Chargement des modules...</p>
        </div>
      ) : modules.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Semestre</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.map((module) => (
              <TableRow key={module._id}>
                <TableCell>{module.title}</TableCell>
                <TableCell>{module.code}</TableCell>
                <TableCell>{module.cycleName}</TableCell>
                <TableCell>{module.semesterName}</TableCell>
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
          <p className="text-xl text-gray-500">Aucun module disponible.</p>
          <p className="text-sm text-gray-400 mt-2">Ajoutez un nouveau module pour commencer.</p>
        </div>
      )}
    </div>
  )
}

