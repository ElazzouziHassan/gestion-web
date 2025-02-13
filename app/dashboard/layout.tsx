"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Users, GraduationCap, Calendar, BookOpen, Layers, School, FileSpreadsheet, LayoutDashboard, FileClock } from "lucide-react"
import { UserCard } from "@/components/UserCard"
import type React from "react"

type AdminUser = {
  firstName: string
  lastName: string
  username: string
  email: string
  role: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AdminUser | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user", {
          headers: {
            Authorization: `Bearer ${document.cookie.split("=")[1]}`,
          },
        })
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          console.error("Erreur lors de la récupération des données utilisateur:", response.statusText)
          router.push("/auth/login")
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateur:", error)
        router.push("/auth/login")
      }
    }

    fetchUser()
  }, [router])

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <nav className="flex-1 py-5 overflow-y-auto">
          <div className="space-y-1 px-2">
            <Link
              href="/dashboard"
              className="flex items-center py-2 px-4 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Tableau de bord
            </Link>
            <Link
              href="/dashboard/students"
              className="flex items-center py-2 px-4 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              <GraduationCap className="mr-3 h-5 w-5" />
              Étudiants
            </Link>
            <Link
              href="/dashboard/professors"
              className="flex items-center py-2 px-4 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              <Users className="mr-3 h-5 w-5" />
              Professeurs
            </Link>
            <Link
              href="/dashboard/modules"
              className="flex items-center py-2 px-4 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              <BookOpen className="mr-3 h-5 w-5" />
              Modules
            </Link>
            <Link
              href="/dashboard/semesters"
              className="flex items-center py-2 px-4 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              <Layers className="mr-3 h-5 w-5" />
              Semestres
            </Link>
            <Link
              href="/dashboard/cycle-masters"
              className="flex items-center py-2 px-4 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              <School className="mr-3 h-5 w-5" />
              Cycles Master
            </Link>
            <Link
              href="/dashboard/schedules"
              className="flex items-center py-2 px-4 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              <Calendar className="mr-3 h-5 w-5" />
              Emplois du temps
            </Link>
            <Link
              href="/dashboard/documents"
              className="flex items-center py-2 px-4 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              <FileSpreadsheet className="mr-3 h-5 w-5" />
              Documents
            </Link>
            <Link
              href="/dashboard/logs"
              className="flex items-center py-2 px-4 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              <FileClock className="mr-3 h-5 w-5" />
              Logs
            </Link>
          </div>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <UserCard />
        </div>
      </aside>
      <main className="flex-1 p-10 overflow-y-auto">{children}</main>
    </div>
  )
}

