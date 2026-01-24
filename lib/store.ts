import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type UserRole = "patient" | "admin" | "staff" | "technician"

export interface User {
  id: string
  name: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
}

export interface Test {
  id: string
  name: string
  price: number
  description: string
  sampleType: string
  turnaroundTime: string
}

export interface Booking {
  id: string
  userId: string
  testId: string
  testName: string
  status: "pending" | "approved" | "collected" | "ready"
  scheduledDate: string
  collectedDate?: string
  reportDate?: string
  address: string
}

export interface Admin {
  id: string
  name: string
  email: string
  role: UserRole
  department?: string
}

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  testName: string
  testId: string
  date: string
  time: string
  status: "pending" | "collected" | "completed"
  notes?: string
}

export interface Report {
  id: string
  bookingId: string
  patientId: string
  testId: string
  uploadedDate: string
  fileUrl?: string
}

interface StoreState {
  user: User | null
  bookings: Booking[]
  isAuthenticated: boolean
  authToken: string | null
  tests: Test[]
  darkMode: boolean
  userRole: UserRole
  admin: Admin | null
  appointments: Appointment[]
  reports: Report[]
  setUser: (user: User | null) => void
  setAuthToken: (token: string | null) => void
  addBooking: (booking: Booking) => void
  updateBooking: (id: string, booking: Partial<Booking>) => void
  getBooking: (id: string) => Booking | undefined
  logout: () => void
  setDarkMode: (dark: boolean) => void
  setUserRole: (role: UserRole) => void
  setAdmin: (admin: Admin | null) => void
  addAppointment: (appointment: Appointment) => void
  updateAppointment: (id: string, updates: Partial<Appointment>) => void
  deleteAppointment: (id: string) => void
  addReport: (report: Report) => void
  deleteReport: (id: string) => void
  isSidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
}

const mockTests: Test[] = [
  {
    id: "1",
    name: "Complete Blood Count",
    price: 499,
    description: "Full CBC with differential",
    sampleType: "Blood",
    turnaroundTime: "24 hours",
  },
  {
    id: "2",
    name: "Thyroid Profile",
    price: 799,
    description: "TSH, T3, T4 levels",
    sampleType: "Blood",
    turnaroundTime: "24 hours",
  },
  {
    id: "3",
    name: "Lipid Profile",
    price: 599,
    description: "Cholesterol and triglycerides",
    sampleType: "Blood",
    turnaroundTime: "24 hours",
  },
  {
    id: "4",
    name: "Liver Function Test",
    price: 699,
    description: "SGPT, SGOT, Bilirubin",
    sampleType: "Blood",
    turnaroundTime: "24 hours",
  },
  {
    id: "5",
    name: "Kidney Function Test",
    price: 649,
    description: "Creatinine, Urea, BUN",
    sampleType: "Blood",
    turnaroundTime: "24 hours",
  },
  {
    id: "6",
    name: "Diabetes Screening",
    price: 549,
    description: "Fasting glucose and HbA1c",
    sampleType: "Blood",
    turnaroundTime: "24 hours",
  },
]

const mockAppointments: Appointment[] = [
  {
    id: "apt1",
    patientId: "p1",
    patientName: "Ali Ahmed",
    testName: "Complete Blood Count",
    testId: "1",
    date: "2024-01-15",
    time: "10:00",
    status: "pending",
  },
  {
    id: "apt2",
    patientId: "p2",
    patientName: "Fatima Khan",
    testName: "Thyroid Profile",
    testId: "2",
    date: "2024-01-15",
    time: "11:30",
    status: "collected",
  },
  {
    id: "apt3",
    patientId: "p3",
    patientName: "Hassan Ali",
    testName: "Lipid Profile",
    testId: "3",
    date: "2024-01-16",
    time: "14:00",
    status: "completed",
  },
]

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      bookings: [],
      isAuthenticated: false,
      authToken: null,
      tests: mockTests,
      darkMode: false,
      userRole: "patient",
      admin: null,
      appointments: mockAppointments,
      reports: [],
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthToken: (token) => set({ authToken: token }),
      addBooking: (booking) => set((state) => ({ bookings: [...state.bookings, booking] })),
      updateBooking: (id, updates) =>
        set((state) => ({
          bookings: state.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),
      getBooking: (id) => get().bookings.find((b) => b.id === id),
      logout: () => {
        set({ user: null, isAuthenticated: false, authToken: null })
        localStorage.removeItem('rahila-storage')
      },
      setDarkMode: (dark) => set({ darkMode: dark }),
      setUserRole: (role) => set({ userRole: role }),
      setAdmin: (admin) => set({ admin }),
      addAppointment: (appointment) => set((state) => ({ appointments: [...state.appointments, appointment] })),
      updateAppointment: (id, updates) =>
        set((state) => ({
          appointments: state.appointments.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),
      deleteAppointment: (id) =>
        set((state) => ({
          appointments: state.appointments.filter((a) => a.id !== id),
        })),
      addReport: (report) => set((state) => ({ reports: [...state.reports, report] })),
      deleteReport: (id) =>
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        })),
      isSidebarOpen: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      closeSidebar: () => set({ isSidebarOpen: false }),
    }),
    {
      name: "rahila-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
