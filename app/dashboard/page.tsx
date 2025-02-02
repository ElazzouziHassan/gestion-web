"use client"

import { useState } from "react"
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
import { MoreHorizontal, Eye, Trash2 } from "lucide-react"
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from "@tanstack/react-table"

type Demande = {
  id: string
  code: string
  user: string
  time: string
  problem: string
}

const data: Demande[] = [
  { id: "1", code: "DEM001", user: "Jean Dupont", time: "2023-05-20 10:30", problem: "Problème de connexion" },
  { id: "2", code: "DEM002", user: "Marie Martin", time: "2023-05-20 11:45", problem: "Accès au cours" },
  { id: "3", code: "DEM003", user: "Pierre Durand", time: "2023-05-20 14:15", problem: "Contestation de note" },
  { id: "4", code: "DEM004", user: "Sophie Lefebvre", time: "2023-05-20 16:00", problem: "Conflit d'horaire" },
  { id: "5", code: "DEM005", user: "Luc Moreau", time: "2023-05-21 09:20", problem: "Demande de document" },
]

const columns: ColumnDef<Demande>[] = [
  {
    accessorKey: "code",
    header: "Code de demande",
  },
  {
    accessorKey: "user",
    header: "Utilisateur",
  },
  {
    accessorKey: "time",
    header: "Heure",
  },
  {
    accessorKey: "problem",
    header: "Problème",
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
            <DropdownMenuItem onClick={() => console.log("Voir demande:", demande.id)}>
              <Eye className="mr-2 h-4 w-4" />
              <span>Voir les détails</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log("Supprimer demande:", demande.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Supprimer</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export default function Dashboard() {
  const [demandeData, setDemandeData] = useState<Demande[]>(data)

  const table = useReactTable({
    data: demandeData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Étudiants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1 000</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Professeurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">50</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cours Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Événements à venir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demandes Récentes</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}

