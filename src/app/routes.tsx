import { createBrowserRouter } from "react-router-dom"

import Splash from "../pages/Splash"
import Company from "../pages/Company"
import Login from "../pages/Login"
import ForgotPassword from "../pages/ForgotPassword"
import Home from "../pages/Home"

export const router = createBrowserRouter([
  { path: "/", element: <Splash /> },
  { path: "/company", element: <Company /> },
  { path: "/login", element: <Login /> },
  { path: "/forgot", element: <ForgotPassword /> },
  { path: "/home", element: <Home /> }
])