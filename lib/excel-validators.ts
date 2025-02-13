type ValidationRule = {
  field: string
  type: "string" | "number" | "date" | "email"
  required?: boolean
  pattern?: RegExp
  min?: number
  max?: number
}

export function validateExcelData(data: any[], rules: ValidationRule[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  data.forEach((row, index) => {
    rules.forEach((rule) => {
      const value = row[rule.field]

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === "")) {
        errors.push(`Ligne ${index + 2}: Le champ "${rule.field}" est requis`)
        return
      }

      // Skip validation if field is not required and empty
      if (!rule.required && (value === undefined || value === null || value === "")) {
        return
      }

      // Validate type
      switch (rule.type) {
        case "string":
          if (typeof value !== "string") {
            errors.push(`Ligne ${index + 2}: Le champ "${rule.field}" doit être une chaîne de caractères`)
          }
          if (rule.pattern && !rule.pattern.test(value)) {
            errors.push(`Ligne ${index + 2}: Le champ "${rule.field}" ne correspond pas au format attendu`)
          }
          break

        case "number":
          const num = Number(value)
          if (isNaN(num)) {
            errors.push(`Ligne ${index + 2}: Le champ "${rule.field}" doit être un nombre`)
          }
          if (rule.min !== undefined && num < rule.min) {
            errors.push(`Ligne ${index + 2}: Le champ "${rule.field}" doit être supérieur à ${rule.min}`)
          }
          if (rule.max !== undefined && num > rule.max) {
            errors.push(`Ligne ${index + 2}: Le champ "${rule.field}" doit être inférieur à ${rule.max}`)
          }
          break

        case "date":
          if (isNaN(Date.parse(value))) {
            errors.push(`Ligne ${index + 2}: Le champ "${rule.field}" doit être une date valide`)
          }
          break

        case "email":
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailPattern.test(value)) {
            errors.push(`Ligne ${index + 2}: Le champ "${rule.field}" doit être une adresse email valide`)
          }
          break
      }
    })
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const studentValidationRules: ValidationRule[] = [
  { field: "firstName", type: "string", required: true },
  { field: "lastName", type: "string", required: true },
  { field: "email", type: "email", required: true },
  { field: "studentNumber", type: "string", required: true },
  { field: "cycleId", type: "string", required: true },
  { field: "currentSemesterId", type: "string", required: true },
  { field: "promo", type: "string", required: true },
]

export const professorValidationRules: ValidationRule[] = [
  { field: "firstName", type: "string", required: true },
  { field: "lastName", type: "string", required: true },
  { field: "email", type: "email", required: true },
  { field: "telephone", type: "string", required: true },
  { field: "status", type: "string", required: true },
  { field: "moduleIds", type: "string", required: true },
]

export const moduleValidationRules: ValidationRule[] = [
  { field: "title", type: "string", required: true },
  { field: "code", type: "string", required: true },
  { field: "cycleId", type: "string", required: true },
  { field: "semesterId", type: "string", required: true },
]

export const semesterValidationRules: ValidationRule[] = [
  { field: "title", type: "string", required: true },
  { field: "cycleId", type: "string", required: true },
  { field: "startDate", type: "date", required: true },
  { field: "endDate", type: "date", required: true },
]

export const cycleMasterValidationRules: ValidationRule[] = [
  { field: "title", type: "string", required: true },
  { field: "major", type: "string", required: true },
  { field: "description", type: "string", required: true },
  { field: "duration", type: "number", required: true, min: 1, max: 5 },
]

