import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfessorProfilePage() {
  // Dummy data
  const professorProfile = {
    name: "Dr. Marie Curie",
    employeeId: "PROF001",
    email: "marie.curie@universite.fr",
    department: "Département de Physique",
    specialization: "Physique nucléaire",
    officeHours: "Mardi et Jeudi, 14:00 - 16:00",
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Profil du professeur</h1>
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Consultez et mettez à jour vos informations personnelles ici.</p>
        </CardContent>
      </Card>
    </div>
  )
}

