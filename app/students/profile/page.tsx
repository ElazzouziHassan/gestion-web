import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function StudentProfilePage() {
  // Dummy data
  const studentProfile = {
    name: "Jean Dupont",
    studentId: "20210001",
    email: "jean.dupont@universite.fr",
    program: "Master en Informatique",
    year: 2,
    gpa: 3.7,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Profil de l'étudiant</h1>
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

