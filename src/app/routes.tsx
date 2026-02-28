import { createBrowserRouter } from "react-router-dom"

import Splash from "../pages/Splash"
import Company from "../pages/Company"
import Login from "../pages/Login"
import ForgotPassword from "../pages/ForgotPassword"
import Home from "../pages/Home"
import Health from "../pages/Health"
import Terms from "../pages/Legal/Terms"
import Privacy from "../pages/Legal/Privacy"
import RouteTransitionLayout from "./RouteTransitionLayout"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RouteTransitionLayout />,
    children: [
      { index: true, element: <Splash /> },
      { path: "company", element: <Company /> },
      { path: "login", element: <Login /> },
      { path: "forgot", element: <ForgotPassword /> },
      { path: "home", element: <Home /> },
      { path: "health", element: <Health /> },
      { path: "terms", element: <Terms /> },
      { path: "privacy", element: <Privacy /> },
    ],
  },
])
