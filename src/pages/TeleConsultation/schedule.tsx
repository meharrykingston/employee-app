import { useEffect, useMemo, useState } from "react"
import { FiArrowLeft, FiChevronLeft, FiChevronRight, FiStar } from "react-icons/fi"
import { useLocation, useNavigate } from "react-router-dom"
import { ensureDoctorActor, ensureEmployeeActor } from "../../services/actorsApi"
import { createAppointment } from "../../services/appointmentsApi"
import { getEmployeeCompanySession } from "../../services/authApi"
import { addNotification } from "../../services/notificationCenter"
import { createTeleconsultSession } from "../../services/teleconsultApi"
import { goBackOrFallback } from "../../utils/navigation"
import "./tele-schedule.css"

type DoctorInfo = {
  id: string
  name: string
  specialty: string
  rating: number
  avatar: string
}

type TeleBooking = {
  id: string
  sessionId: string
  doctorId: string
  doctorName: string
  specialty: string
  scheduledAt: string
  joinWindowStart: string
}

const TELE_BOOKINGS_KEY = "teleconsult_bookings"
const DEFAULT_COMPANY_ID = "astikan-demo-company"

function getEmployeeRtcId() {
  const key = "astikan_employee_rtc_id"
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const generated = `emp-${Math.random().toString(36).slice(2, 10)}`
  localStorage.setItem(key, generated)
  return generated
}

async function ensureTeleconsultActors(doctor: DoctorInfo) {
  const companySession = getEmployeeCompanySession()
  const employeeHandle = getEmployeeRtcId()
  const employee = await ensureEmployeeActor({
    companyReference: companySession?.companyId ?? DEFAULT_COMPANY_ID,
    companyName: companySession?.companyName ?? "Astikan",
    email: `${employeeHandle}@employee.astikan.local`,
    fullName: "Astikan Employee",
    handle: employeeHandle,
    employeeCode: employeeHandle.toUpperCase(),
  })

  const doctorActor = await ensureDoctorActor({
    email: `${doctor.id}@doctor.astikan.local`,
    fullName: doctor.name,
    handle: doctor.id,
    specialization: doctor.specialty,
  })

  return { employee, doctor: doctorActor }
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" })
}

function formatFullDate(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

function formatTime(minutes: number) {
  const h24 = Math.floor(minutes / 60)
  const mins = minutes % 60
  const h = h24 % 12 || 12
  const ampm = h24 >= 12 ? "PM" : "AM"
  return `${h.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")} ${ampm}`
}

function slotToDate(base: Date, slotLabel: string) {
  const parts = slotLabel.trim().split(" ")
  if (parts.length < 2) return null
  const [timePart, ampm] = parts
  const [rawHour, rawMinute] = timePart.split(":").map(Number)
  if (!Number.isFinite(rawHour) || !Number.isFinite(rawMinute)) return null
  let hour = rawHour % 12
  if (ampm.toUpperCase() === "PM") hour += 12
  const scheduled = new Date(base)
  scheduled.setHours(hour, rawMinute, 0, 0)
  return scheduled
}

function getWeekDays(anchor: Date) {
  const dayIndex = (anchor.getDay() + 6) % 7
  const monday = addDays(startOfDay(anchor), -dayIndex)
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

const slotMinutes = Array.from({ length: 14 }, (_, i) => 9 * 60 + i * 30)

export default function TeleSchedule() {
  const navigate = useNavigate()
  const { state } = useLocation() as {
    state?: {
      doctor?: DoctorInfo
      mode?: "tele" | "opd"
      analysisQuery?: string
      selectedSymptoms?: string[]
    }
  }

  const doctor = useMemo<DoctorInfo>(
    () =>
      state?.doctor ?? {
        id: "riza",
        name: "Dr. Riza Yuhi",
        specialty: "Internal Medicine",
        rating: 4.9,
        avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
      },
    [state?.doctor],
  )

  const mode = state?.mode ?? "tele"
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()))
  const [selectedSlot, setSelectedSlot] = useState("")

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate])
  const monthYear = useMemo(() => formatMonthYear(selectedDate), [selectedDate])

  const availableSlots = useMemo(() => {
    const today = startOfDay(new Date()).getTime()
    const selectedDay = startOfDay(selectedDate).getTime()
    const now = new Date()

    return slotMinutes.map((mins) => {
      const label = formatTime(mins)
      const slotDate = new Date(selectedDate)
      slotDate.setHours(Math.floor(mins / 60), mins % 60, 0, 0)
      const disabled = selectedDay === today && slotDate.getTime() <= now.getTime()
      return { label, disabled }
    })
  }, [selectedDate])

  useEffect(() => {
    setSelectedSlot((prev) => {
      const stillValid = availableSlots.find((s) => s.label === prev && !s.disabled)
      if (stillValid) return prev
      const firstAvailable = availableSlots.find((s) => !s.disabled)
      return firstAvailable?.label ?? ""
    })
  }, [availableSlots])

  function moveWeek(direction: "prev" | "next") {
    setSelectedDate((prev) => addDays(prev, direction === "next" ? 7 : -7))
  }

  async function bookAppointment() {
    if (!selectedSlot) return

    if (mode === "opd") {
      navigate("/teleconsultation/pickup", {
        state: {
          doctor,
          analysisQuery: state?.analysisQuery ?? "",
          selectedSymptoms: state?.selectedSymptoms ?? [],
          scheduledDay: formatFullDate(selectedDate),
          scheduledTime: selectedSlot,
        },
      })
      return
    }

    const scheduled = slotToDate(selectedDate, selectedSlot)
    if (!scheduled) return

    try {
      const actors = await ensureTeleconsultActors(doctor)
      const end = new Date(scheduled.getTime() + 30 * 60 * 1000)
      const appointment = await createAppointment({
        companyId: actors.employee.companyId,
        employeeId: actors.employee.employeeUserId,
        doctorId: actors.doctor.userId,
        createdByUserId: actors.employee.employeeUserId,
        appointmentType: "teleconsult",
        source: "employee_booked",
        scheduledStart: scheduled.toISOString(),
        scheduledEnd: end.toISOString(),
        meetingJoinWindowStart: new Date(scheduled.getTime() - 60 * 1000).toISOString(),
        meetingJoinWindowEnd: end.toISOString(),
        status: "confirmed",
        reason: doctor.specialty,
        patientSummary: "Scheduled consultation",
        symptomSnapshot: { scheduled: true },
      })
      const created = await createTeleconsultSession({
        companyId: actors.employee.companyId,
        employeeId: actors.employee.employeeUserId,
        doctorId: actors.doctor.userId,
        appointmentId: appointment.appointmentId,
        preferredProvider: "zego",
        scheduledAt: scheduled.toISOString(),
      })

      const booking: TeleBooking = {
        id: appointment.appointmentId,
        sessionId: created.sessionId,
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        scheduledAt: scheduled.toISOString(),
        joinWindowStart: new Date(scheduled.getTime() - 60 * 1000).toISOString(),
      }
      const existing = JSON.parse(localStorage.getItem(TELE_BOOKINGS_KEY) || "[]") as TeleBooking[]
      localStorage.setItem(TELE_BOOKINGS_KEY, JSON.stringify([booking, ...existing].slice(0, 20)))

      await addNotification({
        title: "Teleconsultation booked",
        body: `Your call with ${doctor.name} is booked. Join will open 1 minute before time.`,
        channel: "consult",
        cta: { label: "Join Call", route: "/teleconsultation" },
        joinWindowStart: booking.joinWindowStart,
        teleconsultSessionId: booking.sessionId,
        doctorId: booking.doctorId,
        scheduledAt: booking.scheduledAt,
      })
    } catch {
      // Keep UI responsive if backend is unavailable.
    }

    navigate("/bookings")
  }

  return (
    <main className="tele-schedule-page app-page-enter">
      <header className="tele-schedule-header app-fade-stagger">
        <button className="tele-schedule-back app-pressable" onClick={() => goBackOrFallback(navigate)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>
        <div>
          <h1>Schedule Appointment</h1>
          <p>{mode === "opd" ? "OPD Visit" : "Teleconsultation"} booking</p>
        </div>
      </header>

      <section className="tele-schedule-content app-content-slide">
        <section className="tele-schedule-hero app-fade-stagger">
          <article className="tele-doctor-hero-card">
            <div className="tele-doctor-copy">
              <p>{doctor.specialty}</p>
              <h2>{doctor.name}</h2>
              <span className="doctor-id-pill">ID: 32145687</span>
              <span className="doctor-rating-pill"><FiStar /> Rating {doctor.rating.toFixed(1)}</span>
            </div>
            <img src={doctor.avatar} alt={doctor.name} loading="lazy" />
          </article>
        </section>

        <section className="tele-calendar-card app-fade-stagger">
          <section className="tele-calendar-head">
            <h3>{monthYear}</h3>
            <div>
              <button className="month-nav app-pressable" type="button" aria-label="Previous week" onClick={() => moveWeek("prev")}><FiChevronLeft /></button>
              <button className="month-nav app-pressable" type="button" aria-label="Next week" onClick={() => moveWeek("next")}><FiChevronRight /></button>
            </div>
          </section>

          <section className="tele-day-row">
            {weekDays.map((day) => {
              const active = startOfDay(day).getTime() === startOfDay(selectedDate).getTime()
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  className={`tele-day-chip app-pressable ${active ? "active" : ""}`}
                  onClick={() => setSelectedDate(startOfDay(day))}
                >
                  <span>{formatDayLabel(day)}</span>
                  <strong>{day.getDate()}</strong>
                </button>
              )
            })}
          </section>
        </section>

        <section className="tele-slot-card app-fade-stagger">
          <header>
            <h4>Today, Availability</h4>
            <span>{availableSlots.filter((s) => !s.disabled).length} Slots</span>
          </header>

          <div className="tele-slot-grid">
            {availableSlots.map((slot) => (
              <button
                key={slot.label}
                type="button"
                className={`tele-slot app-pressable ${selectedSlot === slot.label ? "active" : ""}`}
                onClick={() => setSelectedSlot(slot.label)}
                disabled={slot.disabled}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </section>
      </section>

      <footer className="tele-schedule-footer app-fade-stagger">
        <button className="tele-book-btn app-pressable" type="button" onClick={bookAppointment} disabled={!selectedSlot}>
          Book Appointment
        </button>
      </footer>
    </main>
  )
}
