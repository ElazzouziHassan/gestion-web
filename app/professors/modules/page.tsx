import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfessorModulesPage() {
  // Dummy data
  const modules = [
    { id: 1, name: "Mathématiques avancées", code: "MATH301", level: "M1", students: 45 },
    { id: 2, name: "Physique quantique", code: "PHYS401", level: "M2", students: 30 },
    { id: 3, name: "Mécanique quantique", code: "PHYS301", level: "L3", students: 60 },
    { id: 4, name: "Séminaire de recherche", code: "RECH601", level: "Doctorat", students: 15 },
    { id: 5, name: "Physique statistique", code: "PHYS402", level: "M1", students: 40 },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Modules enseignés</h1>
      <Card>
        <CardHeader>
          <CardTitle>Vos modules</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Consultez la liste des modules que vous enseignez et leurs détails ici.</p>
        </CardContent>
      </Card>
    </div>
  )
}

