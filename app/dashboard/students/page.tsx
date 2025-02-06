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

type Student = {
  _id: string
  firstName: string
  lastName: string
  studentNumber: string
  cycle: string
  currentSemester: string
  promo: string
}

type CycleMaster = {
  _id: string
  title: string
}

type Semester = {
  _id: string
  title: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [cycleMasters, setCycleMasters] = useState<CycleMaster[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    studentNumber: "",
    cycleId: "",
    currentSemesterId: "",
    promo: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchStudents()
    fetchCycleMasters()
    fetchSemesters()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students")
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      } else {
        throw new Error("Failed to fetch students")
      }
    } catch (error) {
      console.error("Error fetching students:", error)
      toast({
        title: "Error",
        description: "Failed to fetch students. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchCycleMasters = async () => {
    try {
      const response = await fetch("/api/cycle-masters")
      if (response.ok) {
        const data = await response.json()
        setCycleMasters(data)
      } else {
        throw new Error("Failed to fetch cycle masters")
      }
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
      if (response.ok) {
        const data = await response.json()
        setSemesters(data)
      } else {
        throw new Error("Failed to fetch semesters")
      }
    } catch (error) {
      console.error("Error fetching semesters:", error)
      toast({
        title: "Error",
        description: "Failed to fetch semesters. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      })
      if (response.ok) {
        setIsAddStudentOpen(false)
        fetchStudents()
        setNewStudent({
          firstName: "",
          lastName: "",
          studentNumber: "",
          cycleId: "",
          currentSemesterId: "",
          promo: "",
        })
        toast({
          title: "Success",
          description: "Student added successfully.",
        })
      } else {
        throw new Error("Failed to add student")
      }
    } catch (error) {
      console.error("Error adding student:", error)
      toast({
        title: "Error",
        description: "Failed to add student. Please try again.",
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
            await fetch("/api/students", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(row),
            })
          }

          fetchStudents()
          toast({
            title: "Success",
            description: "Students imported successfully.",
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
        <h1 className="text-2xl font-bold">Gestion des Étudiants</h1>
        <div className="space-x-2">
          <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un Étudiant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un Nouvel Étudiant</DialogTitle>
                <DialogDescription>Remplissez les informations de l'étudiant ci-dessous.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddStudent}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        value={newStudent.firstName}
                        onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        value={newStudent.lastName}
                        onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="studentNumber">Numéro Étudiant</Label>
                    <Input
                      id="studentNumber"
                      value={newStudent.studentNumber}
                      onChange={(e) => setNewStudent({ ...newStudent, studentNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cycleId">Cycle Master</Label>
                    <Select
                      value={newStudent.cycleId}
                      onValueChange={(value) => setNewStudent({ ...newStudent, cycleId: value })}
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
                    <Label htmlFor="currentSemesterId">Semestre Actuel</Label>
                    <Select
                      value={newStudent.currentSemesterId}
                      onValueChange={(value) => setNewStudent({ ...newStudent, currentSemesterId: value })}
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
                  <div>
                    <Label htmlFor="promo">Promotion</Label>
                    <Input
                      id="promo"
                      value={newStudent.promo}
                      onChange={(e) => setNewStudent({ ...newStudent, promo: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Ajouter l'Étudiant</Button>
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
      {students.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Numéro Étudiant</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Semestre Actuel</TableHead>
              <TableHead>Promotion</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student._id}>
                <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                <TableCell>{student.studentNumber}</TableCell>
                <TableCell>{"Cycle de Master 2IAD"}</TableCell>
                {/* <TableCell>{student.cycle}</TableCell> */}
                <TableCell>{"premier semestre (S1) en automne (2IAD)"}</TableCell>
                {/* <TableCell>{student.currentSemester}</TableCell> */}
                <TableCell>{student.promo}</TableCell>
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
          <p className="text-xl text-gray-500">Aucun étudiant disponible.</p>
          <p className="text-sm text-gray-400 mt-2">Ajoutez un nouvel étudiant pour commencer.</p>
        </div>
      )}
    </div>
  )
}

