"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Bell, Check, X, User, Clock } from "lucide-react"
import { useNotifications, type Notification } from "@/lib/notifications"
import { useData } from "@/lib/data"
import { useAuth } from "@/lib/auth"
import { formatBuenosAiresTime } from "@/lib/utils"

export default function NotificationsPanel() {
  const { user } = useAuth()
  const { getNotifications, markAsRead, deleteNotification } = useNotifications()
  const { approveUser, rejectUser } = useData()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (user?.role === "admin") {
      loadNotifications()
    }
  }, [user])

  const loadNotifications = () => {
    setNotifications(getNotifications())
  }

  const handleApproveUser = (userId: string, notificationId: string) => {
    if (user) {
      approveUser(userId, user.id)
      deleteNotification(notificationId)
      loadNotifications()
    }
  }

  const handleRejectUser = (userId: string, notificationId: string) => {
    rejectUser(userId)
    deleteNotification(notificationId)
    loadNotifications()
  }

  const handleMarkAsRead = (id: string) => {
    markAsRead(id)
    loadNotifications()
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (user?.role !== "admin") return null

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative bg-transparent">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Notificaciones</SheetTitle>
          <SheetDescription>Gestiona las solicitudes y alertas del sistema</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Card key={notification.id} className={`${!notification.read ? "border-primary/50 bg-primary/5" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {notification.type === "user_registration" && <User className="h-4 w-4 text-blue-500" />}
                        {notification.type === "order_reminder" && <Clock className="h-4 w-4 text-orange-500" />}
                        <CardTitle className="text-sm">{notification.title}</CardTitle>
                        {!notification.read && (
                          <Badge variant="secondary" className="text-xs">
                            Nuevo
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <CardDescription className="text-xs">
                      {formatBuenosAiresTime(notification.createdAt).toLocaleString("es-AR", {
                        timeZone: "America/Argentina/Buenos_Aires",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm mb-3">{notification.message}</p>
                    {notification.type === "user_registration" && notification.userId && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveUser(notification.userId!, notification.id)}
                          className="flex-1"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectUser(notification.userId!, notification.id)}
                          className="flex-1"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
