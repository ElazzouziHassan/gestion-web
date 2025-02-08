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
import { Plus, Download, Edit, Trash, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

type Professor = {
  _id: string
  firstName: string
  lastName: string
  email: string
  telephone: string
  status: string
  moduleNames: string[]
  moduleIds: string[]
  profilePicture?: string | null
  pdfId?: string
}

type Module = {
  _id: string
  title: string
}

export default function ProfessorsPage() {
  const [professors, setProfessors] = useState<Professor[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [isAddProfessorOpen, setIsAddProfessorOpen] = useState(false)
  const [isEditProfessorOpen, setIsEditProfessorOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newProfessor, setNewProfessor] = useState({
    firstName: "",
    lastName: "",
    email: "",
    telephone: "",
    status: "vacataire",
    moduleIds: [] as string[],
    profilePicture: null,
  })
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchProfessors()
    fetchModules()
  }, [])

  const fetchProfessors = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/professors")
      if (!response.ok) throw new Error("Failed to fetch professors")
      const data = await response.json()
      setProfessors(data)
    } catch (error) {
      console.error("Error fetching professors:", error)
      toast({
        title: "Error",
        description: "Failed to fetch professors. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchModules = async () => {
    try {
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
      if (!response.ok) throw new Error("Failed to add professor")
      const data = await response.json()
      setIsAddProfessorOpen(false)
      fetchProfessors()
      setNewProfessor({
        firstName: "",
        lastName: "",
        email: "",
        telephone: "",
        status: "vacataire",
        moduleIds: [],
        profilePicture: null,
      })
      toast({
        title: "Success",
        description: `Professor added successfully. PDF generated with ID: ${data.pdfId}`,
      })
    } catch (error) {
      console.error("Error adding professor:", error)
      toast({
        title: "Error",
        description: "Failed to add professor. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditProfessor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProfessor) return
    try {
      const response = await fetch(`/api/professors`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProfessor._id,
          firstName: editingProfessor.firstName,
          lastName: editingProfessor.lastName,
          email: editingProfessor.email,
          telephone: editingProfessor.telephone,
          status: editingProfessor.status,
          moduleIds: editingProfessor.moduleIds,
        }),
      })
      if (!response.ok) throw new Error("Failed to update professor")
      setIsEditProfessorOpen(false)
      fetchProfessors()
      toast({
        title: "Success",
        description: "Professor updated successfully",
      })
    } catch (error) {
      console.error("Error updating professor:", error)
      toast({
        title: "Error",
        description: "Failed to update professor. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProfessor = async (id: string) => {
    if (confirm("Are you sure you want to delete this professor?")) {
      try {
        const response = await fetch(`/api/professors?id=${id}`, {
          method: "DELETE",
        })
        if (!response.ok) throw new Error("Failed to delete professor")
        fetchProfessors()
        toast({
          title: "Success",
          description: "Professor deleted successfully",
        })
      } catch (error) {
        console.error("Error deleting professor:", error)
        toast({
          title: "Error",
          description: "Failed to delete professor. Please try again.",
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
      a.download = "professor_details.pdf"
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
        <h1 className="text-2xl font-bold">Gestion des Professeurs</h1>
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
                    onValueChange={(value) => setNewProfessor({ ...newProfessor, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacataire">Vacataire</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
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
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">Chargement des professeurs...</p>
        </div>
      ) : professors.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prénom</TableHead>
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
                <TableCell>{professor.firstName}</TableCell>
                <TableCell>{professor.lastName}</TableCell>
                <TableCell>{professor.email}</TableCell>
                <TableCell>{professor.telephone}</TableCell>
                <TableCell>{professor.status}</TableCell>
                <TableCell>{professor.moduleNames.join(", ")}</TableCell>
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
                          setEditingProfessor({
                            ...professor,
                            moduleIds: professor.moduleIds || [], // Ensure moduleIds are set
                          })
                          setIsEditProfessorOpen(true)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteProfessor(professor._id)}>
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                      {professor.pdfId && (
                        <DropdownMenuItem onClick={() => handleDownloadPDF(professor.pdfId!)}>
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
          <p className="text-xl text-gray-500">Aucun professeur disponible.</p>
          <p className="text-sm text-gray-400 mt-2">Ajoutez un nouveau professeur pour commencer.</p>
        </div>
      )}

      <Dialog open={isEditProfessorOpen} onOpenChange={setIsEditProfessorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Professeur</DialogTitle>
            <DialogDescription>Modifiez les informations du professeur ci-dessous.</DialogDescription>
          </DialogHeader>
          {editingProfessor && (
            <form onSubmit={handleEditProfessor}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editFirstName">Prénom</Label>
                    <Input
                      id="editFirstName"
                      value={editingProfessor.firstName}
                      onChange={(e) => setEditingProfessor({ ...editingProfessor, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editLastName">Nom</Label>
                    <Input
                      id="editLastName"
                      value={editingProfessor.lastName}
                      onChange={(e) => setEditingProfessor({ ...editingProfessor, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editingProfessor.email}
                    onChange={(e) => setEditingProfessor({ ...editingProfessor, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editTelephone">Téléphone</Label>
                  <Input
                    id="editTelephone"
                    value={editingProfessor.telephone}
                    onChange={(e) => setEditingProfessor({ ...editingProfessor, telephone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editStatus">Statut</Label>
                  <Select
                    value={editingProfessor.status}
                    onValueChange={(value) => setEditingProfessor({ ...editingProfessor, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacataire">Vacataire</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editModules">Modules</Label>
                  <MultiSelect
                    options={modules.map((module) => ({ label: module.title, value: module._id }))}
                    selected={editingProfessor.moduleIds}
                    onChange={(selected) =>
                      setEditingProfessor({
                        ...editingProfessor,
                        moduleIds: selected,
                        moduleNames: modules.filter((m) => selected.includes(m._id)).map((m) => m.title),
                      })
                    }
                    placeholder="Sélectionnez les modules"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Mettre à jour le Professeur</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

