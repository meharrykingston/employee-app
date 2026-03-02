// src/App.tsx
import { RouterProvider } from "react-router-dom"
import { router } from "./app/routes"
import InstallPrompt from "./app/InstallPrompt"
import { CartProvider } from "./app/cart"

function App() {
  return (
    <CartProvider>
      <RouterProvider router={router} />
      <InstallPrompt />
    </CartProvider>
  )
}

export default App
