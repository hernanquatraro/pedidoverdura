"use client"

export interface Product {
  id: string
  name: string
  unit: string
  category: string
  price: number
  qty_dom_mie: number
  qty_jue: number
  qty_vie: number
  createdBy: string
  createdAt: Date
}

export interface OrderItem {
  name: string
  quantity: number
  unit: string
  price: number
}

export interface Order {
  id: string
  userId: string
  userName: string
  date: Date
  items: OrderItem[]
  total: number
  status: "pending" | "sent" | "delivered"
  supplierEmail: string
  notes?: string
}

export interface AppSettings {
  defaultSupplierEmail: string
  companyName: string
  currency: string
}

// Initialize default data
const initializeData = () => {
  if (typeof window === "undefined") return

  // Initialize users with default admin
  if (!localStorage.getItem("users")) {
    const defaultUsers = [
      {
        id: "1",
        email: "admin@empresa.com",
        password: "admin123",
        name: "Administrador",
        role: "admin",
        status: "approved",
        createdAt: new Date(),
      },
      {
        id: "2",
        email: "usuario@empresa.com",
        password: "user123",
        name: "Usuario Demo",
        role: "user",
        status: "approved",
        createdAt: new Date(),
      },
    ]
    localStorage.setItem("users", JSON.stringify(defaultUsers))
  }

  // Initialize products with ARS prices
  if (!localStorage.getItem("products")) {
    const defaultProducts: Product[] = [
      {
        id: "1",
        name: "Tomates",
        unit: "kg",
        category: "Verduras",
        price: 2500,
        qty_dom_mie: 5,
        qty_jue: 8,
        qty_vie: 10,
        createdBy: "1",
        createdAt: new Date(),
      },
      {
        id: "2",
        name: "Lechuga",
        unit: "unidades",
        category: "Verduras",
        price: 1200,
        qty_dom_mie: 3,
        qty_jue: 5,
        qty_vie: 7,
        createdBy: "1",
        createdAt: new Date(),
      },
      {
        id: "3",
        name: "Pan",
        unit: "barras",
        category: "Panadería",
        price: 800,
        qty_dom_mie: 10,
        qty_jue: 15,
        qty_vie: 20,
        createdBy: "1",
        createdAt: new Date(),
      },
    ]
    localStorage.setItem("products", JSON.stringify(defaultProducts))
  }

  // Initialize settings with ARS
  if (!localStorage.getItem("settings")) {
    const defaultSettings: AppSettings = {
      defaultSupplierEmail: "proveedor@ejemplo.com",
      companyName: "Mi Empresa",
      currency: "ARS",
    }
    localStorage.setItem("settings", JSON.stringify(defaultSettings))
  }

  // Initialize orders
  if (!localStorage.getItem("orders")) {
    localStorage.setItem("orders", JSON.stringify([]))
  }
}

export const useData = () => {
  const getProducts = (): Product[] => {
    if (typeof window === "undefined") return []
    return JSON.parse(localStorage.getItem("products") || "[]")
  }

  const saveProduct = (product: Omit<Product, "id" | "createdAt">) => {
    const products = getProducts()
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date(),
    }
    products.push(newProduct)
    localStorage.setItem("products", JSON.stringify(products))
    return newProduct
  }

  const saveProductsBulk = (products: Omit<Product, "id" | "createdAt">[]) => {
    const existingProducts = getProducts()
    const newProducts = products.map((product) => ({
      ...product,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    }))
    const allProducts = [...existingProducts, ...newProducts]
    localStorage.setItem("products", JSON.stringify(allProducts))
    return newProducts
  }

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const products = getProducts()
    const index = products.findIndex((p) => p.id === id)
    if (index !== -1) {
      products[index] = { ...products[index], ...updates }
      localStorage.setItem("products", JSON.stringify(products))
      return products[index]
    }
    return null
  }

  const deleteProduct = (id: string) => {
    const products = getProducts().filter((p) => p.id !== id)
    localStorage.setItem("products", JSON.stringify(products))
  }

  const getOrders = (): Order[] => {
    if (typeof window === "undefined") return []
    return JSON.parse(localStorage.getItem("orders") || "[]").map((order: any) => ({
      ...order,
      date: new Date(order.date),
    }))
  }

  const saveOrder = (order: Omit<Order, "id">) => {
    const orders = getOrders()
    const newOrder: Order = {
      ...order,
      id: Date.now().toString(),
    }
    orders.unshift(newOrder)
    localStorage.setItem("orders", JSON.stringify(orders))
    return newOrder
  }

  const updateOrderStatus = (id: string, status: Order["status"]) => {
    const orders = getOrders()
    const index = orders.findIndex((o) => o.id === id)
    if (index !== -1) {
      orders[index].status = status
      localStorage.setItem("orders", JSON.stringify(orders))
      return orders[index]
    }
    return null
  }

  const getSettings = (): AppSettings => {
    if (typeof window === "undefined") return { defaultSupplierEmail: "", companyName: "", currency: "ARS" }
    return JSON.parse(
      localStorage.getItem("settings") || '{"defaultSupplierEmail":"","companyName":"","currency":"ARS"}',
    )
  }

  const saveSettings = (settings: AppSettings) => {
    localStorage.setItem("settings", JSON.stringify(settings))
  }

  const getUsers = () => {
    if (typeof window === "undefined") return []
    return JSON.parse(localStorage.getItem("users") || "[]").map(({ password, ...user }: any) => user)
  }

  const createUser = (userData: { email: string; password: string; name: string; role: "admin" | "user" }) => {
    const users = JSON.parse(localStorage.getItem("users") || "[]")

    if (users.find((u: any) => u.email === userData.email)) {
      return { success: false, message: "El email ya está registrado" }
    }

    const newUser = {
      id: Date.now().toString(),
      ...userData,
      status: "approved",
      createdAt: new Date(),
    }

    users.push(newUser)
    localStorage.setItem("users", JSON.stringify(users))
    return { success: true, user: newUser }
  }

  const deleteUser = (id: string) => {
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const filteredUsers = users.filter((u: any) => u.id !== id)
    localStorage.setItem("users", JSON.stringify(filteredUsers))
  }

  const approveUser = (userId: string, adminId: string) => {
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const userIndex = users.findIndex((u: any) => u.id === userId)

    if (userIndex !== -1) {
      users[userIndex].status = "approved"
      users[userIndex].approvedBy = adminId
      users[userIndex].approvedAt = new Date()
      localStorage.setItem("users", JSON.stringify(users))

      const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
      const filteredNotifications = notifications.filter(
        (n: any) => !(n.type === "user_registration" && n.userId === userId),
      )
      localStorage.setItem("notifications", JSON.stringify(filteredNotifications))

      return users[userIndex]
    }
    return null
  }

  const rejectUser = (userId: string) => {
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const userIndex = users.findIndex((u: any) => u.id === userId)

    if (userIndex !== -1) {
      users[userIndex].status = "rejected"
      localStorage.setItem("users", JSON.stringify(users))

      const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
      const filteredNotifications = notifications.filter(
        (n: any) => !(n.type === "user_registration" && n.userId === userId),
      )
      localStorage.setItem("notifications", JSON.stringify(filteredNotifications))

      return users[userIndex]
    }
    return null
  }

  return {
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
    createUser,
    deleteUser,
    approveUser,
    rejectUser,
  }
}

// Initialize data on module load
if (typeof window !== "undefined") {
  initializeData()
}
