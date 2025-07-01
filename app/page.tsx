"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  ShoppingCart,
  History,
  Settings,
  Plus,
  Minus,
  Search,
  Mail,
  Download,
  Package,
  Calendar,
  Moon,
  Sun,
  LogOut,
  Users,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Send,
  Copy,
  Bell,
  Upload,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth"
import { useData, type Product, type Order, type AppSettings } from "@/lib/data"
import { useNotifications } from "@/lib/notifications"
import LoginForm from "@/components/login-form"
import ProductModal from "@/components/product-modal"
import { formatOrderText, copyToClipboard } from "@/lib/utils"
import NotificationsPanel from "@/components/notifications-panel"
import ReminderModal from "@/components/reminder-modal"
import { useToast } from "@/hooks/use-toast"
import BulkUploadModal from "@/components/bulk-upload-modal"
import UserCreationModal from "@/components/user-creation-modal"

export default function OrderManager() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const {
    getProducts,
    saveProduct,
    saveProductsBulk,
    updateProduct,
    deleteProduct,
    getOrders,
    saveOrder,
    updateOrderStatus,
    getSettings,
    saveSettings,
    getUsers,
    createUser: createNewUser,
    deleteUser,
  } = useData()

  const {
    getReminders,
    saveReminder,
    updateReminder,
    deleteReminder,
    checkReminders,
    requestNotificationPermission,
    showNotification,
  } = useNotifications()

  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [settings, setSettingsState] = useState<AppSettings>({
    defaultSupplierEmail: "",
    companyName: "",
    currency: "EUR",
  })
  const [users, setUsers] = useState<any[]>([])
  const [currentOrder, setCurrentOrder] = useState<{ [key: string]: number }>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [supplierEmail, setSupplierEmail] = useState("")
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "product" | "user"; id: string; name: string } | null>(
    null,
  )
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<any>(null)
  const [reminders, setReminders] = useState<any[]>([])
  const [activeReminders, setActiveReminders] = useState<any[]>([])
  const { toast } = useToast()
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false)
  const [isUserCreationModalOpen, setIsUserCreationModalOpen] = useState(false)
  const [orderNotes, setOrderNotes] = useState("")

  const [error, setError] = useState("")

  useEffect(() => {
    if (user) {
      loadData()
      loadReminders()
      checkActiveReminders()
      requestNotificationPermission()

      // Check reminders every minute
      const interval = setInterval(checkActiveReminders, 60000)
      return () => clearInterval(interval)
    }
  }, [user])

  const loadData = () => {
    setProducts(getProducts())
    setOrders(getOrders())
    const appSettings = getSettings()
    setSettingsState(appSettings)
    setSupplierEmail(appSettings.defaultSupplierEmail)
    if (user?.role === "admin") {
      setUsers(getUsers())
    }
  }

  const loadReminders = () => {
    setReminders(getReminders())
  }

  const checkActiveReminders = () => {
    if (user) {
      const active = checkReminders(user.id)
      if (active.length > 0 && active.length !== activeReminders.length) {
        setActiveReminders(active)
        active.forEach((reminder) => {
          showNotification(`⏰ ${reminder.title}`, reminder.description || "Es hora de hacer tu pedido", {
            type: "reminder",
            reminderId: reminder.id,
          })
          toast({
            title: `⏰ ${reminder.title}`,
            description: reminder.description || "Es hora de hacer tu pedido",
          })
        })
      }
    }
  }

  if (!user) {
    return <LoginForm />
  }

  const categories = ["Verduras", "Frutas", "Panadería", "Lácteos", "Carnes", "Pescados", "Otros"]
  const existingCategories = Array.from(new Set(products.map((p) => p.category)))
  const allCategories = Array.from(new Set([...categories, ...existingCategories]))

  const getQuantityForToday = (product: Product) => {
    const today = new Date()
    const day = today.getDay() // 0 = Sunday, 1 = Monday, etc.

    // Sunday (0) to Wednesday (3) = qty_dom_mie
    if (day >= 0 && day <= 3) {
      return product.qty_dom_mie
    }
    // Thursday (4) = qty_jue
    else if (day === 4) {
      return product.qty_jue
    }
    // Friday (5) = qty_vie
    else if (day === 5) {
      return product.qty_vie
    }
    // Saturday (6) = qty_dom_mie (weekend, so use Sunday-Wednesday quantity)
    else {
      return product.qty_dom_mie
    }
  }

  const getDayName = () => {
    const today = new Date()
    const day = today.getDay()

    if (day >= 0 && day <= 3) {
      return "Dom-Mié"
    } else if (day === 4) {
      return "Jueves"
    } else if (day === 5) {
      return "Viernes"
    } else {
      return "Dom-Mié"
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const updateQuantity = (productId: string, change: number) => {
    setCurrentOrder((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + change),
    }))
  }

  const calculateOrderTotal = () => {
    return Object.entries(currentOrder).reduce((total, [productId, quantity]) => {
      const product = products.find((p) => p.id === productId)
      return total + (product?.price || 0) * quantity
    }, 0)
  }

  const sendOrder = () => {
    const orderItems = Object.entries(currentOrder)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const product = products.find((p) => p.id === productId)!
        return {
          name: product.name,
          quantity,
          unit: product.unit,
          price: product.price,
        }
      })

    if (orderItems.length === 0) return

    const newOrder: Order = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      date: new Date(),
      items: orderItems,
      total: calculateOrderTotal(),
      status: "pending",
      supplierEmail: supplierEmail || settings.defaultSupplierEmail,
      notes: orderNotes,
    }

    saveOrder(newOrder)
    setOrders((prev) => [newOrder, ...prev])
    setCurrentOrder({})
    setOrderNotes("")
    setOrderSuccess(true)

    // Generate email
    const emailBody = `Hola,

Pedido de: ${user.name}
Fecha: ${new Date().toLocaleDateString("es-ES")}

Productos solicitados:

${orderItems.map((item) => `- ${item.name}: ${item.quantity} ${item.unit}`).join("\n")}

${orderNotes ? `\nAclaraciones:\n${orderNotes}` : ""}

Gracias.`

    const mailtoLink = `mailto:${newOrder.supplierEmail}?subject=${encodeURIComponent(`Pedido ${newOrder.id} - ${settings.companyName}`)}&body=${encodeURIComponent(emailBody)}`
    window.open(mailtoLink)
  }

  const handleSaveProduct = (productData: Omit<Product, "id" | "createdAt" | "createdBy">) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, productData)
    } else {
      saveProduct({ ...productData, createdBy: user.id })
    }
    loadData()
    setEditingProduct(null)
  }

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return

    if (deleteConfirm.type === "product") {
      deleteProduct(deleteConfirm.id)
      setProducts((prev) => prev.filter((p) => p.id !== deleteConfirm.id))
    } else if (deleteConfirm.type === "user") {
      deleteUser(deleteConfirm.id)
      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirm.id))
    }

    setDeleteConfirm(null)
  }

  const handleSaveSettings = () => {
    const newSettings = {
      ...settings,
      defaultSupplierEmail: supplierEmail,
    }
    saveSettings(newSettings)
    if (user?.role === "admin") {
      setUsers(getUsers())
    }
    setSettingsState(newSettings)
  }

  const getOrderStats = () => {
    const userOrders = user.role === "admin" ? orders : orders.filter((o) => o.userId === user.id)
    const totalOrders = userOrders.length
    const thisMonthOrders = userOrders.filter((order) => {
      const orderMonth = order.date.getMonth()
      const currentMonth = new Date().getMonth()
      return orderMonth === currentMonth
    }).length

    return { totalOrders, thisMonthOrders }
  }

  const stats = getOrderStats()
  const displayOrders = user.role === "admin" ? orders : orders.filter((o) => o.userId === user.id)

  const handleCopyOrder = async (order: any) => {
    const orderText = formatOrderText(order)
    const success = await copyToClipboard(orderText)

    if (success) {
      toast({
        title: "¡Copiado!",
        description: "El texto del pedido se ha copiado al portapapeles",
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudo copiar el texto",
        variant: "destructive",
      })
    }
  }

  const handleSaveReminder = (reminderData: any) => {
    if (editingReminder) {
      updateReminder(editingReminder.id, reminderData)
    } else {
      saveReminder({ ...reminderData, createdBy: user.id })
    }
    loadReminders()
    setEditingReminder(null)
  }

  const createUser = async (userData: { email: string; password: string; name: string; role: "admin" | "user" }) => {
    try {
      const result = await createNewUser(userData)

      if (result.success) {
        loadData() // Esto recargará los usuarios
        toast({
          title: "¡Usuario creado!",
          description: `El usuario ${userData.name} ha sido creado exitosamente`,
        })
        return { success: true }
      } else {
        return { success: false, message: result.message || "Error al crear usuario" }
      }
    } catch (err) {
      return { success: false, message: "Error al crear usuario" }
    }
  }

  const onClose = () => {
    setIsUserCreationModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {settings.companyName || "Gestor de Pedidos Pro"}
              </h1>
              <p className="text-muted-foreground">
                {`Bienvenido, ${user.name} (${user.role === "admin" ? "Administrador" : "Usuario"})`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsPanel />
            <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </header>

        {/* Success Alert */}
        {orderSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              ¡Pedido enviado exitosamente! Se ha abierto tu cliente de correo.
            </AlertDescription>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setOrderSuccess(false)}>
              ×
            </Button>
          </Alert>
        )}

        {activeReminders.length > 0 && (
          <div className="mb-6 space-y-2">
            {activeReminders.map((reminder) => (
              <Alert key={reminder.id} className="border-orange-200 bg-orange-50 dark:bg-orange-950">
                <Bell className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  <strong>⏰ {reminder.title}</strong>
                  {reminder.description && <p className="mt-1">{reminder.description}</p>}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Pedidos</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Este Mes</p>
                  <p className="text-2xl font-bold">{stats.thisMonthOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="order" className="space-y-6">
          <TabsList className={user.role === "admin" ? "grid w-full grid-cols-4" : "grid w-full grid-cols-3"}>
            <TabsTrigger value="order" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Nuevo Pedido
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
            {user.role === "admin" && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Administración
              </TabsTrigger>
            )}
          </TabsList>

          {/* Order Tab */}
          <TabsContent value="order" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Crear Nuevo Pedido</CardTitle>
                <CardDescription>
                  {`Cantidades sugeridas para hoy (${new Date().toLocaleDateString("es-ES", { weekday: "long" })} - ${getDayName()})`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {allCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Products List */}
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {products.length === 0 ? "No hay productos disponibles" : "No se encontraron productos"}
                      </div>
                    ) : (
                      filteredProducts.map((product) => {
                        const suggestedQty = getQuantityForToday(product)
                        const currentQty = currentOrder[product.id] ?? 0

                        return (
                          <Card key={product.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{product.name}</h3>
                                  <Badge variant="secondary">{product.category}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{product.unit}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {`Sugerido para hoy (${getDayName()}): ${suggestedQty} ${product.unit}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updateQuantity(product.id, -1)}
                                  disabled={currentQty <= 0}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <div className="w-16 text-center">
                                  <span className="text-lg font-semibold">{currentQty}</span>
                                  <p className="text-xs text-muted-foreground">{product.unit}</p>
                                </div>
                                <Button variant="outline" size="icon" onClick={() => updateQuantity(product.id, 1)}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>

                <Separator />

                {/* Order Summary */}
                <div className="space-y-2 mb-4">
                  <Label htmlFor="orderNotes">Aclaraciones para el proveedor (opcional)</Label>
                  <Textarea
                    id="orderNotes"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ej: Entregar antes de las 10am, tomates bien maduros..."
                    rows={3}
                  />
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex gap-2">
                    <Button
                      onClick={sendOrder}
                      className="flex-1"
                      size="lg"
                      disabled={Object.values(currentOrder).every((qty) => qty === 0)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar por Email
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const orderItems = Object.entries(currentOrder)
                          .filter(([_, quantity]) => quantity > 0)
                          .map(([productId, quantity]) => {
                            const product = products.find((p) => p.id === productId)!
                            return {
                              name: product.name,
                              quantity,
                              unit: product.unit,
                              price: product.price,
                            }
                          })

                        if (orderItems.length > 0) {
                          handleCopyOrder({
                            items: orderItems,
                            total: calculateOrderTotal(),
                            userName: user.name,
                            supplierEmail: supplierEmail || settings.defaultSupplierEmail,
                            notes: orderNotes,
                          })
                        }
                      }}
                      disabled={Object.values(currentOrder).every((qty) => qty === 0)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Historial de Pedidos</CardTitle>
                    <CardDescription>
                      {user.role === "admin" ? "Todos los pedidos del sistema" : "Tus pedidos anteriores"}
                    </CardDescription>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {displayOrders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No hay pedidos registrados</div>
                    ) : (
                      displayOrders.map((order) => (
                        <Card key={order.id} className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold">
                                {order.date.toLocaleDateString("es-ES", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {`${order.date.toLocaleTimeString("es-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}${user.role === "admin" ? ` • ${order.userName}` : ""}`}
                              </p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyOrder(order)}
                                className="h-8 w-8 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant={
                                      order.status === "delivered"
                                        ? "default"
                                        : order.status === "sent"
                                          ? "secondary"
                                          : "outline"
                                    }
                                  >
                                    {order.status === "delivered" && <CheckCircle className="h-3 w-3 mr-1" />}
                                    {order.status === "sent" && <Send className="h-3 w-3 mr-1" />}
                                    {order.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                                    {order.status === "delivered"
                                      ? "Entregado"
                                      : order.status === "sent"
                                        ? "Enviado"
                                        : "Pendiente"}
                                  </Badge>
                                  {user.role === "admin" && (
                                    <Select
                                      value={order.status}
                                      onValueChange={(status: Order["status"]) => {
                                        updateOrderStatus(order.id, status)
                                        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)))
                                      }}
                                    >
                                      <SelectTrigger className="w-32 h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pendiente</SelectItem>
                                        <SelectItem value="sent">Enviado</SelectItem>
                                        <SelectItem value="delivered">Entregado</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{`${item.name}: ${item.quantity} ${item.unit}`}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración General</CardTitle>
                  <CardDescription>Configuración básica de la aplicación</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Nombre de la empresa</Label>
                      <Input
                        id="companyName"
                        value={settings.companyName}
                        onChange={(e) => setSettingsState({ ...settings, companyName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Moneda</Label>
                      <Select
                        value={settings.currency}
                        onValueChange={(value) => setSettingsState({ ...settings, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ARS">ARS ($)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="supplierEmail">Email del proveedor por defecto</Label>
                    <Input
                      id="supplierEmail"
                      type="email"
                      value={supplierEmail}
                      onChange={(e) => setSupplierEmail(e.target.value)}
                      placeholder="proveedor@ejemplo.com"
                    />
                  </div>
                  <Button onClick={handleSaveSettings}>Guardar Configuración</Button>
                </CardContent>
              </Card>

              {user.role === "admin" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Gestión de Productos</CardTitle>
                    <CardDescription>Administra el catálogo de productos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Button onClick={() => setIsProductModalOpen(true)} className="flex-1">
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Producto
                        </Button>
                        <Button onClick={() => setIsBulkUploadModalOpen(true)} variant="outline" className="flex-1">
                          <Upload className="h-4 w-4 mr-2" />
                          Carga Masiva
                        </Button>
                      </div>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {products.map((product) => (
                            <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-semibold">{product.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {`${product.category} • ${product.unit}`}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingProduct(product)
                                    setIsProductModalOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setDeleteConfirm({ type: "product", id: product.id, name: product.name })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Recordatorios de Pedidos</CardTitle>
                  <CardDescription>Configura recordatorios automáticos (horario de Buenos Aires)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={() => setIsReminderModalOpen(true)} className="w-full">
                      <Bell className="h-4 w-4 mr-2" />
                      Nuevo Recordatorio
                    </Button>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {reminders.map((reminder) => (
                          <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">{reminder.title}</p>
                                <Badge variant={reminder.active ? "default" : "secondary"}>
                                  {reminder.active ? "Activo" : "Inactivo"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">{reminder.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {`${reminder.dayOfWeek
                                  .map((day: number) => ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][day])
                                  .join(", ")} • ${reminder.startTime} - ${reminder.endTime}`}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingReminder(reminder)
                                  setIsReminderModalOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  deleteReminder(reminder.id)
                                  loadReminders()
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {reminders.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No hay recordatorios configurados</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin Tab */}
          {user.role === "admin" && (
            <TabsContent value="admin" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Usuarios</CardTitle>
                  <CardDescription>Administra los usuarios del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setIsUserCreationModalOpen(true)} className="w-full mb-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Usuario
                  </Button>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {users.map((userData) => (
                        <div key={userData.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-semibold">{userData.name}</p>
                            <p className="text-sm text-muted-foreground">{userData.email}</p>
                            <Badge variant={userData.role === "admin" ? "default" : "secondary"}>
                              {userData.role === "admin" ? "Administrador" : "Usuario"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              {new Date(userData.createdAt).toLocaleDateString("es-ES")}
                            </p>
                            {userData.id !== user.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteConfirm({ type: "user", id: userData.id, name: userData.name })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Product Modal */}
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false)
            setEditingProduct(null)
          }}
          onSave={handleSaveProduct}
          product={editingProduct}
          categories={allCategories}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente{" "}
                {deleteConfirm?.type === "product" ? "el producto" : "el usuario"} "{deleteConfirm?.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => {
            setIsReminderModalOpen(false)
            setEditingReminder(null)
          }}
          onSave={handleSaveReminder}
          reminder={editingReminder}
        />

        <BulkUploadModal
          isOpen={isBulkUploadModalOpen}
          onClose={() => setIsBulkUploadModalOpen(false)}
          onSave={(products) => {
            saveProductsBulk(products)
            loadData()
          }}
          createdBy={user.id}
        />

        <UserCreationModal
          isOpen={isUserCreationModalOpen}
          onClose={() => setIsUserCreationModalOpen(false)}
          onSave={createUser}
        />
      </div>
    </div>
  )
}
