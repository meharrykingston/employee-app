import { createBrowserRouter } from "react-router-dom"

import Splash from "../pages/Splash"
import Company from "../pages/Company"
import Login from "../pages/Login"
import ForgotPassword from "../pages/ForgotPassword"
import Home from "../pages/Home"
import Health from "../pages/Health"
import Assessment from "../pages/assessment"
import Terms from "../pages/Legal/Terms"
import Privacy from "../pages/Legal/Privacy"
import AIChat from "../pages/AIChat"
import StressRelief from "../pages/StressChat"
import LabTests from "../pages/LabTest"
import LabLocation from "../pages/LabTest/location"
import LabBookNow from "../pages/LabTest/booknow"
import LabSchedule from "../pages/LabTest/schedule"
import LabConfirm from "../pages/LabTest/confirm"
import Wallet from "../pages/Wallet"
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
      { path: "assessment", element: <Assessment /> },
      { path: "home", element: <Home /> },
      { path: "health", element: <Health /> },
      { path: "ai-chat", element: <AIChat /> },
      { path: "stress-relief", element: <StressRelief /> },
      { path: "lab-tests", element: <LabTests /> },
      { path: "lab-tests/location", element: <LabLocation /> },
      { path: "lab-tests/book-now", element: <LabBookNow /> },
      { path: "lab-tests/schedule", element: <LabSchedule /> },
      { path: "lab-tests/confirm", element: <LabConfirm /> },
      { path: "wallet", element: <Wallet /> },
      { path: "terms", element: <Terms /> },
      { path: "privacy", element: <Privacy /> },
    ],
  },
])
