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
import { Plus, Download, Edit, Trash, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

type Student = {
  _id: string
  firstName: string
  lastName: string
  studentNumber: string
  cycleName: string
  semesterName: string
  promo: string
  pdfId?: string
}

type CycleMaster = {
  _id: string
  title: string
}

type Semester = {
  _id: string
  title: string
}

type EditingStudent = {
  _id: string
  firstName: string
  lastName: string
  studentNumber: string
  cycleId: string
  semesterId: string
  cycleName: string
  semesterName: string
  promo: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [cycleMasters, setCycleMasters] = useState<CycleMaster[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    studentNumber: "",
    cycleId: "",
    currentSemesterId: "",
    promo: "",
    email: "",
  })
  const [editingStudent, setEditingStudent] = useState<EditingStudent | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchStudents()
    fetchCycleMasters()
    fetchSemesters()
  }, [])

  const fetchStudents = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/students")
      if (!response.ok) throw new Error("Failed to fetch students")

      const data = await response.json()
      setStudents(data)
    } catch (error) {
      console.error("Error fetching students:", error)
      toast({
        title: "Error",
        description: "Failed to fetch students. Please try again.",
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

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      })
      if (!response.ok) throw new Error("Failed to add student")
      const data = await response.json()
      setIsAddStudentOpen(false)
      fetchStudents()
      setNewStudent({
        firstName: "",
        lastName: "",
        email: "",
        studentNumber: "",
        cycleId: "",
        currentSemesterId: "",
        promo: "",
      })
      toast({
        title: "Success",
        description: `Student added successfully. PDF generated with ID: ${data.pdfId}`,
      })
    } catch (error) {
      console.error("Error adding student:", error)
      toast({
        title: "Error",
        description: "Failed to add student. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent) return
    try {
      const response = await fetch(`/api/students`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingStudent._id,
          firstName: editingStudent.firstName,
          lastName: editingStudent.lastName,
          studentNumber: editingStudent.studentNumber,
          cycleId: editingStudent.cycleId,
          currentSemesterId: editingStudent.semesterId,
          promo: editingStudent.promo,
        }),
      })
      if (!response.ok) throw new Error("Failed to update student")
      setIsEditStudentOpen(false)
      fetchStudents()
      toast({
        title: "Success",
        description: "Student updated successfully",
      })
    } catch (error) {
      console.error("Error updating student:", error)
      toast({
        title: "Error",
        description: "Failed to update student. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteStudent = async (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        const response = await fetch(`/api/students?id=${id}`, {
          method: "DELETE",
        })
        if (!response.ok) throw new Error("Failed to delete student")
        fetchStudents()
        toast({
          title: "Success",
          description: "Student deleted successfully",
        })
      } catch (error) {
        console.error("Error deleting student:", error)
        toast({
          title: "Error",
          description: "Failed to delete student. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDownloadPDF = async (pdfId: string) => {
    try {
      const response = await fetch(`/api/pdf/${pdfId}`)
      if (!response.ok) throw new Error("Failed to fetch PDF")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = "student_details.pdf"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des Étudiants</h1>
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="studentNumber">Numéro d'étudiant</Label>
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
                  <Label htmlFor="currentSemesterId">Semestre actuel</Label>
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
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">Chargement des étudiants...</p>
        </div>
      ) : students.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prénom</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Numéro d'étudiant</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Semestre</TableHead>
              <TableHead>Promotion</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student._id}>
                <TableCell>{student.firstName}</TableCell>
                <TableCell>{student.lastName}</TableCell>
                <TableCell>{student.studentNumber}</TableCell>
                <TableCell>{student.cycleName}</TableCell>
                <TableCell>{student.semesterName}</TableCell>
                <TableCell>{student.promo}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingStudent(student as unknown as EditingStudent)
                          setIsEditStudentOpen(true)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteStudent(student._id)}>
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                      {student.pdfId && (
                        <DropdownMenuItem onClick={() => handleDownloadPDF(student.pdfId!)}>
                          <Download className="mr-2 h-4 w-4" />
                          <span>Download PDF</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      <Dialog open={isEditStudentOpen} onOpenChange={setIsEditStudentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'Étudiant</DialogTitle>
            <DialogDescription>Modifiez les informations de l'étudiant ci-dessous.</DialogDescription>
          </DialogHeader>
          {editingStudent && (
            <form onSubmit={handleEditStudent}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editFirstName">Prénom</Label>
                    <Input
                      id="editFirstName"
                      value={editingStudent.firstName}
                      onChange={(e) => setEditingStudent({ ...editingStudent, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editLastName">Nom</Label>
                    <Input
                      id="editLastName"
                      value={editingStudent.lastName}
                      onChange={(e) => setEditingStudent({ ...editingStudent, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editStudentNumber">Numéro d'étudiant</Label>
                  <Input
                    id="editStudentNumber"
                    value={editingStudent.studentNumber}
                    onChange={(e) => setEditingStudent({ ...editingStudent, studentNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editCycleId">Cycle Master</Label>
                  <Select
                    value={editingStudent.cycleId || ""}
                    onValueChange={(value) =>
                      setEditingStudent({
                        ...editingStudent,
                        cycleId: value,
                        cycleName: cycleMasters.find((c) => c._id === value)?.title || "",
                      })
                    }
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
                  <Label htmlFor="editCurrentSemesterId">Semestre actuel</Label>
                  <Select
                    value={editingStudent.semesterId || ""}
                    onValueChange={(value) =>
                      setEditingStudent({
                        ...editingStudent,
                        semesterId: value,
                        semesterName: semesters.find((s) => s._id === value)?.title || "",
                      })
                    }
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
                  <Label htmlFor="editPromo">Promotion</Label>
                  <Input
                    id="editPromo"
                    value={editingStudent.promo}
                    onChange={(e) => setEditingStudent({ ...editingStudent, promo: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Mettre à jour l'Étudiant</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

