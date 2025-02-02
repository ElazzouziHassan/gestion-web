"use client"

import { useState } from "react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UploadCloud, UserPlus, MoreHorizontal, Eye, Download } from "lucide-react"
import * as XLSX from "xlsx"

type Student = {
  id: string
  name: string
  email: string
  major: string
  year: number
  username: string
  password: string
}

// Dummy data to simulate database records
const dummyStudents: Student[] = [
  {
    id: "S001",
    name: "Alice Johnson",
    email: "alice@example.com",
    major: "Computer Science",
    year: 2,
    username: "alice_j",
    password: "password123",
  },
  {
    id: "S002",
    name: "Bob Smith",
    email: "bob@example.com",
    major: "Physics",
    year: 3,
    username: "bob_s",
    password: "password456",
  },
  {
    id: "S003",
    name: "Charlie Brown",
    email: "charlie@example.com",
    major: "Mathematics",
    year: 1,
    username: "charlie_b",
    password: "password789",
  },
  {
    id: "S004",
    name: "Diana Ross",
    email: "diana@example.com",
    major: "Chemistry",
    year: 4,
    username: "diana_r",
    password: "password101",
  },
  {
    id: "S005",
    name: "Ethan Hunt",
    email: "ethan@example.com",
    major: "Biology",
    year: 2,
    username: "ethan_h",
    password: "password202",
  },
]

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>(dummyStudents)
  const [message, setMessage] = useState<string | null>(null)
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [newStudent, setNewStudent] = useState<Omit<Student, "id">>({
    name: "",
    email: "",
    major: "",
    year: 1,
    username: "",
    password: "",
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Student[]
        setStudents((prevStudents) => [...prevStudents, ...jsonData])
        setMessage(`${jsonData.length} students imported successfully.`)
        setTimeout(() => setMessage(null), 3000) // Clear message after 3 seconds
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault()
    const id = `S${(students.length + 1).toString().padStart(3, "0")}`
    const studentToAdd = { ...newStudent, id }
    setStudents((prevStudents) => [...prevStudents, studentToAdd])
    setIsAddStudentOpen(false)
    setNewStudent({ name: "", email: "", major: "", year: 1, username: "", password: "" })
    setMessage("Student added successfully.")
    setTimeout(() => setMessage(null), 3000)
  }

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student)
    setIsViewDetailsOpen(true)
  }

  const handleDownloadCard = (student: Student) => {
    const cardContent = `
Student Details:
ID: ${student.id}
Name: ${student.name}
Email: ${student.email}
Major: ${student.major}
Year: ${student.year}
Username: ${student.username}
Password: ${student.password}
  `.trim()

    const blob = new Blob([cardContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${student.name.replace(" ", "_")}_details.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Students Management</h1>
        <p className="mb-4">Here you can manage student information, enrollments, and academic records.</p>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Input id="file-upload" type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          <Label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex items-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
              <UploadCloud className="h-5 w-5" />
              <span>Upload Excel File</span>
            </div>
          </Label>
        </div>

        <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <UserPlus className="h-5 w-5 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Enter the details of the new student here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStudent}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="major" className="text-right">
                    Major
                  </Label>
                  <Input
                    id="major"
                    value={newStudent.major}
                    onChange={(e) => setNewStudent({ ...newStudent, major: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="year" className="text-right">
                    Year
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    min={1}
                    max={6}
                    value={newStudent.year}
                    onChange={(e) => setNewStudent({ ...newStudent, year: Number.parseInt(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={newStudent.username}
                    onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{message}</span>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-2">List of Students</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Major</TableHead>
              <TableHead>Year</TableHead>
              {/* <TableHead>Password</TableHead> */}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.id}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.major}</TableCell>
                <TableCell>{student.year}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleViewDetails(student)}>
                        <Eye className="mr-2 h-4 w-4" />
                        <span>View details</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadCard(student)}>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Download card</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">ID</Label>
                <div className="col-span-2">{selectedStudent.id}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">Name</Label>
                <div className="col-span-2">{selectedStudent.name}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">Email</Label>
                <div className="col-span-2">{selectedStudent.email}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">Major</Label>
                <div className="col-span-2">{selectedStudent.major}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">Year</Label>
                <div className="col-span-2">{selectedStudent.year}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">Username</Label>
                <div className="col-span-2">{selectedStudent.username}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

