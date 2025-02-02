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

type Professor = {
  id: string
  name: string
  email: string
  department: string
  position: string
  username: string
  password: string
}

// Dummy data to simulate database records
const dummyProfessors: Professor[] = [
  {
    id: "P001",
    name: "Dr. John Doe",
    email: "john@university.edu",
    department: "Computer Science",
    position: "Associate Professor",
    username: "john_d",
    password: "prof123",
  },
  {
    id: "P002",
    name: "Dr. Jane Smith",
    email: "jane@university.edu",
    department: "Physics",
    position: "Professor",
    username: "jane_s",
    password: "prof456",
  },
  {
    id: "P003",
    name: "Dr. Mike Johnson",
    email: "mike@university.edu",
    department: "Mathematics",
    position: "Assistant Professor",
    username: "mike_j",
    password: "prof789",
  },
  {
    id: "P004",
    name: "Dr. Sarah Brown",
    email: "sarah@university.edu",
    department: "Chemistry",
    position: "Professor",
    username: "sarah_b",
    password: "prof101",
  },
  {
    id: "P005",
    name: "Dr. Chris Lee",
    email: "chris@university.edu",
    department: "Biology",
    position: "Associate Professor",
    username: "chris_l",
    password: "prof202",
  },
]

export default function ProfessorsPage() {
  const [professors, setProfessors] = useState<Professor[]>(dummyProfessors)
  const [message, setMessage] = useState<string | null>(null)
  const [isAddProfessorOpen, setIsAddProfessorOpen] = useState(false)
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false)
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null)
  const [newProfessor, setNewProfessor] = useState<Omit<Professor, "id">>({
    name: "",
    email: "",
    department: "",
    position: "",
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Professor[]
        setProfessors((prevProfessors) => [...prevProfessors, ...jsonData])
        setMessage(`${jsonData.length} professors imported successfully.`)
        setTimeout(() => setMessage(null), 3000) // Clear message after 3 seconds
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const handleAddProfessor = (e: React.FormEvent) => {
    e.preventDefault()
    const id = `P${(professors.length + 1).toString().padStart(3, "0")}`
    const professorToAdd = { ...newProfessor, id }
    setProfessors((prevProfessors) => [...prevProfessors, professorToAdd])
    setIsAddProfessorOpen(false)
    setNewProfessor({ name: "", email: "", department: "", position: "", username: "", password: "" })
    setMessage("Professor added successfully.")
    setTimeout(() => setMessage(null), 3000)
  }

  const handleViewDetails = (professor: Professor) => {
    setSelectedProfessor(professor)
    setIsViewDetailsOpen(true)
  }

  const handleDownloadCard = (professor: Professor) => {
    const cardContent = `
Professor Details:
ID: ${professor.id}
Name: ${professor.name}
Email: ${professor.email}
Department: ${professor.department}
Position: ${professor.position}
Username: ${professor.username}
Password: ${professor.password}
  `.trim()

    const blob = new Blob([cardContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${professor.name.replace(" ", "_")}_details.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Professors Management</h1>
        <p className="mb-4">Here you can manage professor information, course assignments, and schedules.</p>
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

        <Dialog open={isAddProfessorOpen} onOpenChange={setIsAddProfessorOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <UserPlus className="h-5 w-5 mr-2" />
              Add Professor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Professor</DialogTitle>
              <DialogDescription>
                Enter the details of the new professor here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddProfessor}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newProfessor.name}
                    onChange={(e) => setNewProfessor({ ...newProfessor, name: e.target.value })}
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
                    value={newProfessor.email}
                    onChange={(e) => setNewProfessor({ ...newProfessor, email: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department" className="text-right">
                    Department
                  </Label>
                  <Input
                    id="department"
                    value={newProfessor.department}
                    onChange={(e) => setNewProfessor({ ...newProfessor, department: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="position" className="text-right">
                    Position
                  </Label>
                  <Input
                    id="position"
                    value={newProfessor.position}
                    onChange={(e) => setNewProfessor({ ...newProfessor, position: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={newProfessor.username}
                    onChange={(e) => setNewProfessor({ ...newProfessor, username: e.target.value })}
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
                    value={newProfessor.password}
                    onChange={(e) => setNewProfessor({ ...newProfessor, password: e.target.value })}
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
        <h2 className="text-xl font-semibold mb-2">List of Professors</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              {/* <TableHead>Password</TableHead> */}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professors.map((professor) => (
              <TableRow key={professor.id}>
                <TableCell>{professor.id}</TableCell>
                <TableCell>{professor.name}</TableCell>
                <TableCell>{professor.email}</TableCell>
                <TableCell>{professor.department}</TableCell>
                <TableCell>{professor.position}</TableCell>
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
                      <DropdownMenuItem onClick={() => handleViewDetails(professor)}>
                        <Eye className="mr-2 h-4 w-4" />
                        <span>View details</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadCard(professor)}>
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
            <DialogTitle>Professor Details</DialogTitle>
          </DialogHeader>
          {selectedProfessor && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">ID</Label>
                <div className="col-span-2">{selectedProfessor.id}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">Name</Label>
                <div className="col-span-2">{selectedProfessor.name}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">Email</Label>
                <div className="col-span-2">{selectedProfessor.email}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">Department</Label>
                <div className="col-span-2">{selectedProfessor.department}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">Position</Label>
                <div className="col-span-2">{selectedProfessor.position}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">Username</Label>
                <div className="col-span-2">{selectedProfessor.username}</div>
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

