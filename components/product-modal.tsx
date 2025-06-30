"use client"

import { DialogTitle } from "@/components/ui/dialog"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog"
import type { Product } from "@/lib/data"

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (product: Omit<Product, "id" | "createdAt" | "createdBy">) => void
  product?: Product | null
  categories: string[]
}

export default function ProductModal({ isOpen, onClose, onSave, product, categories }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    category: "",
    price: 0,
    qty_dom_mie: 0,
    qty_jue: 0,
    qty_vie: 0,
  })

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        unit: product.unit,
        category: product.category,
        price: product.price,
        qty_dom_mie: product.qty_dom_mie,
        qty_jue: product.qty_jue,
        qty_vie: product.qty_vie,
      })
    } else {
      setFormData({
        name: "",
        unit: "",
        category: "",
        price: 0,
        qty_dom_mie: 0,
        qty_jue: 0,
        qty_vie: 0,
      })
    }
  }, [product, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.unit || !formData.category) return

    onSave(formData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Producto" : "Agregar Producto"}</DialogTitle>
          <DialogDescription>
            {product ? "Modifica los datos del producto" : "Completa la información del nuevo producto"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit" className="text-right">
                Unidad
              </Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="col-span-3"
                placeholder="kg, unidades, litros..."
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Categoría
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                  <SelectItem value="nueva">+ Nueva categoría</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.category === "nueva" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newCategory" className="text-right">
                  Nueva
                </Label>
                <Input
                  id="newCategory"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="col-span-3"
                  placeholder="Nombre de la nueva categoría"
                />
              </div>
            )}
            <div className="col-span-4">
              <Label className="text-sm font-medium">Cantidades Sugeridas</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <Label htmlFor="qty_dom_mie" className="text-xs">
                    Dom-Mié
                  </Label>
                  <Input
                    id="qty_dom_mie"
                    type="number"
                    min="0"
                    value={formData.qty_dom_mie}
                    onChange={(e) => setFormData({ ...formData, qty_dom_mie: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="qty_jue" className="text-xs">
                    Jueves
                  </Label>
                  <Input
                    id="qty_jue"
                    type="number"
                    min="0"
                    value={formData.qty_jue}
                    onChange={(e) => setFormData({ ...formData, qty_jue: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="qty_vie" className="text-xs">
                    Viernes
                  </Label>
                  <Input
                    id="qty_vie"
                    type="number"
                    min="0"
                    value={formData.qty_vie}
                    onChange={(e) => setFormData({ ...formData, qty_vie: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{product ? "Actualizar" : "Agregar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
