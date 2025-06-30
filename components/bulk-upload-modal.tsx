"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, AlertCircle, CheckCircle } from "lucide-react"
import { parseCSV, validateProductData } from "@/lib/utils"
import type { Product } from "@/lib/data"

interface BulkUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (products: Omit<Product, "id" | "createdAt" | "createdBy">[]) => void
  createdBy: string
}

export default function BulkUploadModal({ isOpen, onClose, onSave, createdBy }: BulkUploadModalProps) {
  const [csvData, setCsvData] = useState("")
  const [parsedData, setParsedData] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setCsvData(text)
        parseData(text)
      }
      reader.readAsText(file)
    }
  }

  const parseData = (data: string) => {
    try {
      const parsed = parseCSV(data)
      setParsedData(parsed)

      const validationErrors: string[] = []
      parsed.forEach((row, index) => {
        const validation = validateProductData(row)
        if (!validation.valid) {
          validationErrors.push(`Fila ${index + 2}: ${validation.errors.join(", ")}`)
        }
      })

      setErrors(validationErrors)
    } catch (error) {
      setErrors(["Error al procesar el archivo. Verifique el formato."])
    }
  }

  const handleSubmit = () => {
    if (errors.length > 0) return

    setLoading(true)

    const products = parsedData.map((row) => ({
      name: row.name || row.nombre || "",
      unit: row.unit || row.unidad || "",
      category: row.category || row.categoria || "",
      price: 0,
      qty_dom_mie: Number(row.qty_dom_mie || row.cantidad_dom_mie || 0),
      qty_jue: Number(row.qty_jue || row.cantidad_jue || 0),
      qty_vie: Number(row.qty_vie || row.cantidad_vie || 0),
      createdBy,
    }))

    onSave(products)
    setLoading(false)
    onClose()

    // Reset form
    setCsvData("")
    setParsedData([])
    setErrors([])
  }

  const exampleCSV = `name,unit,category,qty_dom_mie,qty_jue,qty_vie
Tomates,kg,Verduras,5,8,10
Lechuga,unidades,Verduras,3,5,7
Pan,barras,Panadería,10,15,20`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Carga Masiva de Productos</DialogTitle>
          <DialogDescription>
            Sube productos desde un archivo CSV o Excel, o pega los datos directamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Subir archivo CSV/Excel</Label>
            <div className="flex items-center gap-2">
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Seleccionar Archivo
              </Button>
            </div>
          </div>

          {/* Manual CSV Input */}
          <div className="space-y-2">
            <Label htmlFor="csv-data">O pega los datos CSV aquí</Label>
            <Textarea
              id="csv-data"
              value={csvData}
              onChange={(e) => {
                setCsvData(e.target.value)
                parseData(e.target.value)
              }}
              placeholder="Pega aquí los datos CSV..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          {/* Example Format */}
          <div className="space-y-2">
            <Label>Formato de ejemplo:</Label>
            <div className="bg-muted p-3 rounded-lg">
              <pre className="text-xs overflow-x-auto">{exampleCSV}</pre>
            </div>
            <p className="text-xs text-muted-foreground">
              Columnas: name (nombre), unit (unidad), category (categoría), qty_dom_mie (cantidad dom-mié), qty_jue
              (cantidad jueves), qty_vie (cantidad viernes)
            </p>
          </div>

          {/* Preview */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <Label>Vista previa ({parsedData.length} productos)</Label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                {parsedData.slice(0, 5).map((row, index) => (
                  <div key={index} className="text-sm py-1 border-b last:border-b-0">
                    <strong>{row.name || row.nombre}</strong> - {row.unit || row.unidad} - $
                    {Number(row.price || row.precio || 0).toLocaleString("es-AR")}
                  </div>
                ))}
                {parsedData.length > 5 && (
                  <div className="text-xs text-muted-foreground pt-2">... y {parsedData.length - 5} productos más</div>
                )}
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">Errores encontrados:</p>
                  {errors.slice(0, 5).map((error, index) => (
                    <p key={index} className="text-xs">
                      {error}
                    </p>
                  ))}
                  {errors.length > 5 && <p className="text-xs">... y {errors.length - 5} errores más</p>}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success */}
          {parsedData.length > 0 && errors.length === 0 && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                ¡Datos válidos! Se cargarán {parsedData.length} productos.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={parsedData.length === 0 || errors.length > 0 || loading}>
            {loading ? "Cargando..." : `Cargar ${parsedData.length} Productos`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
