import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfessorSchedulesPage() {
  // Dummy data
  const schedule = [
    { day: "Lundi", time: "09:00 - 11:00", module: "Mathématiques avancées", class: "M1 Informatique", room: "A101" },
    { day: "Lundi", time: "14:00 - 16:00", module: "Physique quantique", class: "M2 Physique", room: "B205" },
    { day: "Mardi", time: "10:00 - 12:00", module: "Séminaire de recherche", class: "Doctorants", room: "C302" },
    { day: "Mercredi", time: "09:00 - 11:00", module: "Mécanique quantique", class: "L3 Physique", room: "D104" },
    { day: "Jeudi", time: "14:00 - 16:00", module: "Heures de bureau", class: "-", room: "Bureau E105" },
    { day: "Vendredi", time: "10:00 - 12:00", module: "Physique statistique", class: "M1 Physique", room: "B103" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Emploi du temps</h1>
      <Card>
        <CardHeader>
          <CardTitle>Votre emploi du temps</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Consultez votre emploi du temps détaillé ici.</p>
        </CardContent>
      </Card>
    </div>
  )
}

