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
import Meditation from "../pages/Meditation"
import LabTests from "../pages/LabTest"
import LabReadiness from "../pages/LabTest/readiness"
import LabLocation from "../pages/LabTest/location"
import LabBookNow from "../pages/LabTest/booknow"
import LabSchedule from "../pages/LabTest/schedule"
import LabConfirm from "../pages/LabTest/confirm"
import TeleConsultation from "../pages/TeleConsultation"
import OpdPickup from "../pages/TeleConsultation/pickup"
import TeleSchedule from "../pages/TeleConsultation/schedule"
import AISymptomAnalyser from "../pages/AISymptomAnalyser"
import Pharmacy from "../pages/Pharmacy"
import PharmacyCategories from "../pages/PharmacyCategories"
import MedicineDetail from "../pages/MedicineDetail"
import CartPage from "../pages/Cart"
import PharmacySuccess from "../pages/PharmacySuccess"
import MedicineTracking from "../pages/MedicineTracking"
import Wallet from "../pages/Wallet"
import Badges from "../pages/Badges"
import WeekendTasks from "../pages/WeekendTasks"
import HealthAssessments from "../pages/HealthAssessments"
import Settings from "../pages/Settings"
import Address from "../pages/Address"
import ProfileInfo from "../pages/ProfileInfo"
import HealthInfo from "../pages/HealthInfo"
import Bookings from "../pages/Bookings"
import Reports from "../pages/Reports"
import Notifications from "../pages/Notifications"
import MetricDetails from "../pages/MetricDetails"
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
      { path: "meditation", element: <Meditation /> },
      { path: "lab-tests", element: <LabTests /> },
      { path: "lab-tests/readiness", element: <LabReadiness /> },
      { path: "lab-tests/location", element: <LabLocation /> },
      { path: "lab-tests/book-now", element: <LabBookNow /> },
      { path: "lab-tests/schedule", element: <LabSchedule /> },
      { path: "lab-tests/confirm", element: <LabConfirm /> },
      { path: "teleconsultation", element: <TeleConsultation /> },
      { path: "teleconsultation/pickup", element: <OpdPickup /> },
      { path: "teleconsultation/schedule", element: <TeleSchedule /> },
      { path: "ai-symptom-analyser", element: <AISymptomAnalyser /> },
      { path: "pharmacy", element: <Pharmacy /> },
      { path: "pharmacy/categories", element: <PharmacyCategories /> },
      { path: "pharmacy/tracking", element: <MedicineTracking /> },
      { path: "pharmacy/medicine/:medicineId", element: <MedicineDetail /> },
      { path: "pharmacy/booking-success", element: <PharmacySuccess /> },
      { path: "cart", element: <CartPage /> },
      { path: "weekend-tasks", element: <WeekendTasks /> },
      { path: "health-assessments", element: <HealthAssessments /> },
      { path: "wallet", element: <Wallet /> },
      { path: "badges", element: <Badges /> },
      { path: "settings", element: <Settings /> },
      { path: "address", element: <Address /> },
      { path: "profile-info", element: <ProfileInfo /> },
      { path: "health-info", element: <HealthInfo /> },
      { path: "bookings", element: <Bookings /> },
      { path: "reports", element: <Reports /> },
      { path: "notifications", element: <Notifications /> },
      { path: "metric/:metricId", element: <MetricDetails /> },
      { path: "terms", element: <Terms /> },
      { path: "privacy", element: <Privacy /> },
    ],
  },
])
