export type Module = {
  _id: string
  title: string
  code: string
}

export type Professor = {
  _id: string
  firstName: string
  lastName: string
}

export type Session = {
  module: {
    _id: string
    title: string
    code: string
  }
  professor: {
    _id: string
    firstName: string
    lastName: string
  }
  timeSlot: string
  place: string
}

export type DailySchedule = {
  day: string
  sessions: Session[]
}

export type Schedule = {
  _id: string
  cycleMaster: string
  cycleMasterTitle: string
  semester: string
  semesterTitle: string
  dailySchedules: DailySchedule[]
  schedule_pdf: string | null
}

