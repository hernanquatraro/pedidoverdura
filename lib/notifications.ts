"use client"

export interface Notification {
  id: string
  type: "user_registration" | "order_reminder" | "general"
  title: string
  message: string
  userId?: string
  createdAt: Date
  read: boolean
  data?: any
}

export interface OrderReminder {
  id: string
  title: string
  description: string
  dayOfWeek: number[] // 0 = Sunday, 1 = Monday, etc.
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  active: boolean
  createdBy: string
  createdAt: Date
}

export const useNotifications = () => {
  const getNotifications = (): Notification[] => {
    if (typeof window === "undefined") return []
    return JSON.parse(localStorage.getItem("notifications") || "[]").map((notif: any) => ({
      ...notif,
      createdAt: new Date(notif.createdAt),
    }))
  }

  const markAsRead = (id: string) => {
    const notifications = getNotifications()
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    localStorage.setItem("notifications", JSON.stringify(updated))
  }

  const deleteNotification = (id: string) => {
    const notifications = getNotifications().filter((n) => n.id !== id)
    localStorage.setItem("notifications", JSON.stringify(notifications))
  }

  const getReminders = (): OrderReminder[] => {
    if (typeof window === "undefined") return []
    return JSON.parse(localStorage.getItem("reminders") || "[]").map((reminder: any) => ({
      ...reminder,
      createdAt: new Date(reminder.createdAt),
    }))
  }

  const saveReminder = (reminder: Omit<OrderReminder, "id" | "createdAt">) => {
    const reminders = getReminders()
    const newReminder: OrderReminder = {
      ...reminder,
      id: Date.now().toString(),
      createdAt: new Date(),
    }
    reminders.push(newReminder)
    localStorage.setItem("reminders", JSON.stringify(reminders))
    return newReminder
  }

  const updateReminder = (id: string, updates: Partial<OrderReminder>) => {
    const reminders = getReminders()
    const index = reminders.findIndex((r) => r.id === id)
    if (index !== -1) {
      reminders[index] = { ...reminders[index], ...updates }
      localStorage.setItem("reminders", JSON.stringify(reminders))
      return reminders[index]
    }
    return null
  }

  const deleteReminder = (id: string) => {
    const reminders = getReminders().filter((r) => r.id !== id)
    localStorage.setItem("reminders", JSON.stringify(reminders))
  }

  const checkReminders = (userId: string): OrderReminder[] => {
    const now = new Date()
    const buenosAiresTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
    const currentDay = buenosAiresTime.getDay()
    const currentTime = buenosAiresTime.toTimeString().slice(0, 5) // HH:MM format

    const reminders = getReminders()
    return reminders.filter((reminder) => {
      if (!reminder.active) return false
      if (!reminder.dayOfWeek.includes(currentDay)) return false

      const isInTimeRange = currentTime >= reminder.startTime && currentTime <= reminder.endTime
      return isInTimeRange
    })
  }

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }
    return false
  }

  const showNotification = (title: string, body: string, data?: any) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        data,
      })
    }
  }

  return {
    getNotifications,
    markAsRead,
    deleteNotification,
    getReminders,
    saveReminder,
    updateReminder,
    deleteReminder,
    checkReminders,
    requestNotificationPermission,
    showNotification,
  }
}
