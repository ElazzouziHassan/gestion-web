import type React from "react"
import Link from "next/link"
import { UserCircle, Home, Calendar, BookOpen } from "lucide-react"

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-md py-4">
        <nav className="container mx-auto">
          <ul className="flex justify-center space-x-6">
            <li>
              <Link href="/students" className="flex items-center text-gray-700 hover:text-blue-600">
                <Home className="mr-2 h-5 w-5" />
                Accueil
              </Link>
            </li>
            <li>
              <Link href="/students/profile" className="flex items-center text-gray-700 hover:text-blue-600">
                <UserCircle className="mr-2 h-5 w-5" />
                Profil
              </Link>
            </li>
            <li>
              <Link href="/students/schedules" className="flex items-center text-gray-700 hover:text-blue-600">
                <Calendar className="mr-2 h-5 w-5" />
                Emplois du temps
              </Link>
            </li>
            <li>
              <Link href="/students/modules" className="flex items-center text-gray-700 hover:text-blue-600">
                <BookOpen className="mr-2 h-5 w-5" />
                Modules
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="flex-grow container mx-auto py-8">{children}</main>
    </div>
  )
}

