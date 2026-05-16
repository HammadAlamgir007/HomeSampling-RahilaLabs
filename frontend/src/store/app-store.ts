/**
 * Zustand app store — global client-side state.
 * Types are imported from types/index.ts for clean separation.
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Admin, UserRole, Test, Booking, Appointment, Report } from '@/types'

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
    isSidebarOpen: boolean
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
    toggleSidebar: () => void
    closeSidebar: () => void
}

const _mockTests: Test[] = [
    { id: '1', name: 'Complete Blood Count', price: 499, description: 'Full CBC with differential', sampleType: 'Blood', turnaroundTime: '24 hours' },
    { id: '2', name: 'Thyroid Profile', price: 799, description: 'TSH, T3, T4 levels', sampleType: 'Blood', turnaroundTime: '24 hours' },
    { id: '3', name: 'Lipid Profile', price: 599, description: 'Cholesterol and triglycerides', sampleType: 'Blood', turnaroundTime: '24 hours' },
    { id: '4', name: 'Liver Function Test', price: 699, description: 'SGPT, SGOT, Bilirubin', sampleType: 'Blood', turnaroundTime: '24 hours' },
    { id: '5', name: 'Kidney Function Test', price: 649, description: 'Creatinine, Urea, BUN', sampleType: 'Blood', turnaroundTime: '24 hours' },
    { id: '6', name: 'Diabetes Screening', price: 549, description: 'Fasting glucose and HbA1c', sampleType: 'Blood', turnaroundTime: '24 hours' },
]

const _mockAppointments: Appointment[] = [
    { id: 'apt1', patientId: 'p1', patientName: 'Ali Ahmed', testName: 'Complete Blood Count', testId: '1', date: '2024-01-15', time: '10:00', status: 'pending' },
    { id: 'apt2', patientId: 'p2', patientName: 'Fatima Khan', testName: 'Thyroid Profile', testId: '2', date: '2024-01-15', time: '11:30', status: 'collected' },
    { id: 'apt3', patientId: 'p3', patientName: 'Hassan Ali', testName: 'Lipid Profile', testId: '3', date: '2024-01-16', time: '14:00', status: 'completed' },
]

export const useStore = create<StoreState>()(
    persist(
        (set, get) => ({
            user: null,
            bookings: [],
            isAuthenticated: false,
            authToken: null,
            tests: _mockTests,
            darkMode: false,
            userRole: 'patient',
            admin: null,
            appointments: _mockAppointments,
            reports: [],
            isSidebarOpen: false,
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setAuthToken: (token) => set({ authToken: token }),
            addBooking: (booking) => set((s) => ({ bookings: [...s.bookings, booking] })),
            updateBooking: (id, updates) => set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b)) })),
            getBooking: (id) => get().bookings.find((b) => b.id === id),
            logout: () => {
                set({ user: null, isAuthenticated: false, authToken: null })
                if (typeof window !== 'undefined') sessionStorage.removeItem('rahila-storage')
            },
            setDarkMode: (dark) => set({ darkMode: dark }),
            setUserRole: (role) => set({ userRole: role }),
            setAdmin: (admin) => set({ admin }),
            addAppointment: (a) => set((s) => ({ appointments: [...s.appointments, a] })),
            updateAppointment: (id, u) => set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...u } : a)) })),
            deleteAppointment: (id) => set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) })),
            addReport: (r) => set((s) => ({ reports: [...s.reports, r] })),
            deleteReport: (id) => set((s) => ({ reports: s.reports.filter((r) => r.id !== id) })),
            toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
            closeSidebar: () => set({ isSidebarOpen: false }),
        }),
        { name: 'rahila-storage', storage: createJSONStorage(() => sessionStorage) }
    )
)
