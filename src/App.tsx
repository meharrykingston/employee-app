// src/App.tsx
import { useEffect } from "react"
import { RouterProvider } from "react-router-dom"
import { router } from "./app/routes"
import InstallPrompt from "./app/InstallPrompt"
import { CartProvider } from "./app/cart"
import { ProcessLoadingProvider } from "./app/process-loading"
import { warmLabCatalogSearchIndex } from "./services/labApi"

function App() {
  useEffect(() => {
    void warmLabCatalogSearchIndex()
  }, [])

  return (
    <ProcessLoadingProvider>
      <CartProvider>
        <RouterProvider router={router} />
        <InstallPrompt />
      </CartProvider>
    </ProcessLoadingProvider>
  )
}

export default App
