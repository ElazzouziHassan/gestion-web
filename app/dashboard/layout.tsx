"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Users, GraduationCap, Calendar } from "lucide-react"
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
            Authorization: `Bearer ${document.cookie.split("=")[1]}`, // Assuming the token is the only cookie
          },
        })
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          console.error("Error fetching user data:", response.statusText)
          router.push("/auth/login")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
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
              <Users className="mr-3 h-5 w-5" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/students"
              className="flex items-center py-2 px-4 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              <GraduationCap className="mr-3 h-5 w-5" />
              Students
            </Link>
            <Link
              href="/dashboard/professors"
              className="flex items-center py-2 px-4 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              <Users className="mr-3 h-5 w-5" />
              Professors
            </Link>
            <Link
              href="/dashboard/schedules"
              className="flex items-center py-2 px-4 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              <Calendar className="mr-3 h-5 w-5" />
              Schedules
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

