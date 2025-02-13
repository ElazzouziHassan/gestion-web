"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

type Log = {
  _id: string
  userType: "admin" | "student" | "professor"
  user: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  action: string
  details: string
  timestamp: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState({
    userType: "",
    action: "",
    startDate: "",
    endDate: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams(filter as Record<string, string>)
      const response = await fetch(`/api/logs?${queryParams}`)
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des logs")
      }
      const data = await response.json()
      setLogs(data)
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les logs. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilter((prev) => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    fetchLogs()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Journaux d'Activité des Utilisateurs</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Select onValueChange={(value) => handleFilterChange("userType", value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Type d'utilisateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="student">Étudiant</SelectItem>
                <SelectItem value="professor">Professeur</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Action"
              onChange={(e) => handleFilterChange("action", e.target.value)}
              className="w-[200px]"
            />
            <Input
              type="date"
              placeholder="Date de début"
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="w-[200px]"
            />
            <Input
              type="date"
              placeholder="Date de fin"
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="w-[200px]"
            />
            <Button onClick={applyFilters}>Appliquer les filtres</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Journaux d'Activité</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Chargement des journaux d'activité...</p>
          ) : logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Détails</TableHead>
                  <TableHead>Horodatage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>{log.userType}</TableCell>
                    <TableCell>{`${log.user.firstName} ${log.user.lastName} `}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.details}</TableCell>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>Aucun journal d'activité trouvé.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

