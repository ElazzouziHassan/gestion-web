"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadCloud, Download } from "lucide-react"

type Schedule = {
  id: string
  name: string
  file?: File
  downloadUrl?: string
}

// Dummy data for predefined schedules
const predefinedStudentSchedules: Schedule[] = [
  { id: "s1", name: "Fall 2023 Schedule", downloadUrl: "/dummy/fall2023.pdf" },
  { id: "s2", name: "Spring 2024 Schedule", downloadUrl: "/dummy/spring2024.pdf" },
  { id: "s3", name: "Summer 2024 Schedule", downloadUrl: "/dummy/summer2024.pdf" },
]

const predefinedProfessorSchedules: Schedule[] = [
  { id: "p1", name: "Dr. John Doe Schedule", downloadUrl: "/dummy/john_doe.pdf" },
  { id: "p2", name: "Dr. Jane Smith Schedule", downloadUrl: "/dummy/jane_smith.pdf" },
  { id: "p3", name: "Dr. Mike Johnson Schedule", downloadUrl: "/dummy/mike_johnson.pdf" },
]

export default function SchedulesPage() {
  const [studentSchedules, setStudentSchedules] = useState<Schedule[]>(predefinedStudentSchedules)
  const [professorSchedules, setProfessorSchedules] = useState<Schedule[]>(predefinedProfessorSchedules)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: "student" | "professor") => {
    const file = event.target.files?.[0]
    if (file) {
      const newSchedule: Schedule = {
        id: Date.now().toString(),
        name: file.name,
        file: file,
      }
      if (type === "student") {
        setStudentSchedules((prev) => [...prev, newSchedule])
      } else {
        setProfessorSchedules((prev) => [...prev, newSchedule])
      }
    }
  }

  const handleDownload = (schedule: Schedule) => {
    if (schedule.file) {
      const url = URL.createObjectURL(schedule.file)
      const a = document.createElement("a")
      a.href = url
      a.download = schedule.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else if (schedule.downloadUrl) {
      window.open(schedule.downloadUrl, "_blank")
    }
  }

  const ScheduleList = ({ schedules, type }: { schedules: Schedule[]; type: "student" | "professor" }) => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          id={`${type}-file-upload`}
          type="file"
          accept=".pdf"
          onChange={(e) => handleFileUpload(e, type)}
          className="hidden"
        />
        <Label htmlFor={`${type}-file-upload`} className="cursor-pointer">
          <div className="flex items-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
            <UploadCloud className="h-5 w-5" />
            <span>Upload New Schedule</span>
          </div>
        </Label>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schedules.map((schedule) => (
          <Card key={schedule.id}>
            <CardHeader>
              <CardTitle className="text-sm">{schedule.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => handleDownload(schedule)} className="w-full">
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Schedules Management</h1>
        <p className="mb-4">Here you can manage schedules for students and professors.</p>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList>
          <TabsTrigger value="students">Student Schedules</TabsTrigger>
          <TabsTrigger value="professors">Professor Schedules</TabsTrigger>
        </TabsList>
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Schedules</CardTitle>
              <CardDescription>Download semester schedules or upload new ones.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduleList schedules={studentSchedules} type="student" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="professors">
          <Card>
            <CardHeader>
              <CardTitle>Professor Schedules</CardTitle>
              <CardDescription>Download professor schedules or upload new ones.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduleList schedules={professorSchedules} type="professor" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

