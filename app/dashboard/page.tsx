"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Users, GraduationCap, BookOpen, School } from "lucide-react"
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from "@tanstack/react-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

type Demande = {
  _id: string
  userType: string
  user: string
  description: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function Dashboard() {
  const [demandeData, setDemandeData] = useState<Demande[]>([])
  const [totalStudents, setTotalStudents] = useState<number>(0)
  const [totalProfessors, setTotalProfessors] = useState<number>(0)
  const [totalModules, setTotalModules] = useState<number>(0)
  const [totalCycleMasters, setTotalCycleMasters] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)
  const [emailContent, setEmailContent] = useState("")
  const { toast } = useToast()

  const columns: ColumnDef<Demande>[] = [
    {
      accessorKey: "user",
      header: "Utilisateur",
    },
    {
      accessorKey: "userType",
      header: "Type",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "status",
      header: "Statut",
    },
    {
      accessorKey: "createdAt",
      header: "Date de création",
      cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleString(),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const demande = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Ouvrir le menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleResolve(demande)}>Résoudre</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(demande._id)}>Supprimer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: demandeData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [studentsResponse, professorsResponse, modulesResponse, cycleMastersResponse, demandesResponse] =
          await Promise.all([
            fetch("/api/students"),
            fetch("/api/professors"),
            fetch("/api/modules"),
            fetch("/api/cycle-masters"),
            fetch("/api/demandes"),
          ])

        if (
          !studentsResponse.ok ||
          !professorsResponse.ok ||
          !modulesResponse.ok ||
          !cycleMastersResponse.ok ||
          !demandesResponse.ok
        ) {
          throw new Error("One or more API calls failed")
        }

        const [studentsData, professorsData, modulesData, cycleMastersData, demandesData] = await Promise.all([
          studentsResponse.json(),
          professorsResponse.json(),
          modulesResponse.json(),
          cycleMastersResponse.json(),
          demandesResponse.json(),
        ])

        setTotalStudents(studentsData.length)
        setTotalProfessors(professorsData.length)
        setTotalModules(modulesData.length)
        setTotalCycleMasters(cycleMastersData.length)
        setDemandeData(demandesData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to fetch dashboard data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleResolve = (demande: Demande) => {
    setSelectedDemande(demande)
    setIsResolveDialogOpen(true)
  }

  const handleSendEmail = async () => {
    if (!selectedDemande) return

    try {
      const response = await fetch(`/api/demandes/${selectedDemande._id}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailContent, userType: selectedDemande.userType }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to resolve demande")
      }

      toast({
        title: "Success",
        description: "Demande resolved and email sent successfully.",
      })

      setDemandeData((prevData) =>
        prevData.map((d) => (d._id === selectedDemande._id ? { ...d, status: "resolved" } : d)),
      )
    } catch (error) {
      console.error("Error resolving demande:", error)
      toast({
        title: "Error",
        variant: "destructive",
      })
    } finally {
      setIsResolveDialogOpen(false)
      setSelectedDemande(null)
      setEmailContent("")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/demandes/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete demande")
      }

      toast({
        title: "Success",
        description: "Demande deleted successfully.",
      })

      setDemandeData((prevData) => prevData.filter((d) => d._id !== id))
    } catch (error) {
      console.error("Error deleting demande:", error)
      toast({
        title: "Error",
        description: "Failed to delete demande. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Étudiants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Professeurs</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalProfessors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cours</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalModules}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cycles de Master</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalCycleMasters}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demandes Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Chargement des demandes...</div>
          ) : demandeData.length > 0 ? (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <p className="text-xl text-gray-500">Aucune demande récente.</p>
              <p className="text-sm text-gray-400 mt-2">Les nouvelles demandes apparaîtront ici.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Résoudre la demande</DialogTitle>
            <DialogDescription>
              Écrivez le contenu de l'e-mail à envoyer à l'utilisateur pour résoudre sa demande.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email-content" className="text-right">
                Contenu de l'e-mail
              </Label>
              <Textarea
                id="email-content"
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSendEmail}>
              Envoyer l'e-mail et résoudre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

