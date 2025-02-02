import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center z-0 opacity-20"
        style={{ backgroundImage: "url('/api/placeholder?width=1920&height=1080')" }}
      ></div>
      <div className="relative z-10 text-center space-y-8 max-w-3xl px-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl mb-4">
          Bienvenue sur le Système de Gestion Universitaire
        </h1>
        <p className="text-xl sm:text-2xl text-gray-200 mb-8">
          Simplifiez vos processus académiques avec notre solution de gestion complète.
        </p>
        <div className="space-y-4">
          <div className="space-x-4">
            <Link href="/auth/login">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 hover:text-blue-700 transition-colors duration-200 text-lg px-8 py-3 rounded-full shadow-lg"
              >
                Connexion Admin
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 text-lg px-8 py-3 rounded-full shadow-lg"
              >
                S'inscrire
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-300">
            Gérez efficacement les étudiants, les professeurs et les emplois du temps.
          </p>
        </div>
      </div>
      <footer className="absolute bottom-4 text-center text-gray-300 text-sm">
        © 2023 Système de Gestion Universitaire. Tous droits réservés.
      </footer>
    </div>
  )
}

