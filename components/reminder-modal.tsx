"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { OrderReminder } from "@/lib/notifications"

interface ReminderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (reminder: Omit<OrderReminder, "id" | "createdAt" | "createdBy">) => void
  reminder?: OrderReminder | null
}

const daysOfWeek = [
  { id: 0, name: "Domingo" },
  { id: 1, name: "Lunes" },
  { id: 2, name: "Martes" },
  { id: 3, name: "Miércoles" },
  { id: 4, name: "Jueves" },
  { id: 5, name: "Viernes" },
  { id: 6, name: "Sábado" },
]

export default function ReminderModal({ isOpen, onClose, onSave, reminder }: ReminderModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dayOfWeek: [] as number[],
    startTime: "09:00",
    endTime: "10:00",
    active: true,
  })

  useEffect(() => {
    if (reminder) {
      setFormData({
        title: reminder.title,
        description: reminder.description,
        dayOfWeek: reminder.dayOfWeek,
        startTime: reminder.startTime,
        endTime: reminder.endTime,
        active: reminder.active,
      })
    } else {
      setFormData({
        title: "",
        description: "",
        dayOfWeek: [],
        startTime: "09:00",
        endTime: "10:00",
        active: true,
      })
    }
  }, [reminder, isOpen])

  const handleDayToggle = (dayId: number) => {
    setFormData((prev) => ({
      ...prev,
      dayOfWeek: prev.dayOfWeek.includes(dayId)
        ? prev.dayOfWeek.filter((d) => d !== dayId)
        : [...prev.dayOfWeek, dayId],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || formData.dayOfWeek.length === 0) return

    onSave(formData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{reminder ? "Editar Recordatorio" : "Nuevo Recordatorio"}</DialogTitle>
          <DialogDescription>
            Configura recordatorios automáticos para pedidos específicos (horario de Buenos Aires)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del recordatorio</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Pedido de verduras para el fin de semana"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalles adicionales del pedido..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Días de la semana</Label>
              <div className="grid grid-cols-2 gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.id}`}
                      checked={formData.dayOfWeek.includes(day.id)}
                      onCheckedChange={() => handleDayToggle(day.id)}
                    />
                    <Label htmlFor={`day-${day.id}`} className="text-sm">
                      {day.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Hora de inicio</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Hora de fin</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: !!checked })}
              />
              <Label htmlFor="active">Recordatorio activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{reminder ? "Actualizar" : "Crear"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
