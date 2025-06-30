import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatOrderText = (order: {
  id?: string
  date?: Date
  userName?: string
  items: Array<{ name: string; quantity: number; unit: string; price: number }>
  total: number
  supplierEmail?: string
  notes?: string
}) => {
  const buenosAiresTime = order.date
    ? new Date(order.date.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
    : new Date()

  const formattedDate = buenosAiresTime.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  })

  const formattedTime = buenosAiresTime.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  })

  return `🛒 PEDIDO ${order.id ? `#${order.id}` : "NUEVO"}

📅 Fecha: ${formattedDate}
🕐 Hora: ${formattedTime}${order.userName ? `\n👤 Solicitado por: ${order.userName}` : ""}

📦 PRODUCTOS:
${order.items
  .map((item) => `• ${item.name}: ${item.quantity} ${item.unit} - $${formatPrice(item.price * item.quantity)}`)
  .join("\n")}

💰 TOTAL: $${formatPrice(order.total)}

${order.supplierEmail ? `📧 Proveedor: ${order.supplierEmail}` : ""}
${order.notes ? `\n📝 Aclaraciones:\n${order.notes}` : ""}

¡Gracias!`
}

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const result = document.execCommand("copy")
      textArea.remove()
      return result
    }
  } catch (err) {
    console.error("Failed to copy text: ", err)
    return false
  }
}

export const getBuenosAiresTime = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
}

export const formatBuenosAiresTime = (date: Date) => {
  return new Date(date.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
}

export const parseCSV = (csvText: string): any[] => {
  const lines = csvText.trim().split("\n")
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
  const data = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
    if (values.length === headers.length) {
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })
      data.push(row)
    }
  }

  return data
}

export const validateProductData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!data.name || data.name.trim() === "") {
    errors.push("El nombre del producto es requerido")
  }

  if (!data.unit || data.unit.trim() === "") {
    errors.push("La unidad es requerida")
  }

  if (!data.category || data.category.trim() === "") {
    errors.push("La categoría es requerida")
  }

  if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0) {
    errors.push("El precio debe ser un número mayor a 0")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
