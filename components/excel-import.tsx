"use client"

import { useState } from "react"
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "./ui/label"


interface ImportResult {
  success: boolean
  message: string
  details?: string
}

interface ExcelImportProps {
  onImport: (data: any[]) => Promise<ImportResult>
  templateName?: string // Updated: templateUrl to templateName
  entityName: string
  isOpen: boolean
  onClose: () => void
}

export function ExcelImport({ onImport, templateName, entityName, isOpen, onClose }: ExcelImportProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      setProgress(20)
      setResult(null)

      const data = await readExcelFile(file)
      setProgress(40)

      const result = await onImport(data)
      setProgress(100)
      setResult(result)
    } catch (error) {
      setResult({
        success: false,
        message: "Erreur lors de l'importation",
        details: error instanceof Error ? error.message : "Une erreur inattendue s'est produite",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })
          const worksheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          resolve(jsonData)
        } catch (error) {
          reject(new Error("Erreur lors de la lecture du fichier Excel"))
        }
      }

      reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier"))
      reader.readAsArrayBuffer(file)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importer des {entityName}</DialogTitle>
          <DialogDescription>
            Importez vos données à partir d'un fichier Excel. Assurez-vous que votre fichier suit le format requis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {templateName && ( // Updated: templateUrl to templateName
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Conseil</AlertTitle>
              <AlertDescription>
                Téléchargez notre{" "}
                <a href={`/templates/${templateName}`} className="underline" download>
                  modèle Excel
                </a>{" "}
                pour vous assurer que votre fichier est correctement formaté.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="file-upload" className="cursor-pointer">
              {" "}
              {/* Added Label component */}
              <div className="flex items-center gap-2 rounded-md border border-dashed p-4 hover:bg-accent">
                <Upload className="h-4 w-4" />
                <span>Sélectionner un fichier Excel</span>
              </div>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isImporting}
              />
            </Label>
          </div>

          {isImporting && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">Importation en cours...</p>
            </div>
          )}

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Succès" : "Erreur"}</AlertTitle>
              <AlertDescription>
                {result.message}
                {result.details && <div className="mt-2 text-sm">{result.details}</div>}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

