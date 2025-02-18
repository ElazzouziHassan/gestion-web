import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function StudentHomePage() {
  // Dummy data
  const announcements = [
    { id: 1, title: "Examens de fin de semestre", content: "Les examens auront lieu du 15 au 30 juin." },
    {
      id: 2,
      title: "Fermeture de la bibliothèque",
      content: "La bibliothèque sera fermée pour rénovation du 1er au 15 juillet.",
    },
  ]

  const upcomingDeadlines = [
    { id: 1, module: "Mathématiques avancées", task: "Devoir maison", dueDate: "2023-05-25" },
    { id: 2, module: "Physique quantique", task: "Rapport de laboratoire", dueDate: "2023-05-30" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Tableau de bord de l'étudiant</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Annonces récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Consultez les dernières annonces ici.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Prochaines échéances</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Vérifiez vos prochaines échéances ici.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

