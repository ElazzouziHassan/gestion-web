import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function StudentModulesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Modules</h1>
      <Card>
        <CardHeader>
          <CardTitle>Vos modules</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Consultez la liste de vos modules et leurs détails ici.</p>
        </CardContent>
      </Card>
    </div>
  )
}

