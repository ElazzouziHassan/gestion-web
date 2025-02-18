import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfessorHomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Tableau de bord du professeur</h1>
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
            <CardTitle>Prochains cours</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Vérifiez vos prochains cours ici.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

