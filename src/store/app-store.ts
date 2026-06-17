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



export const useStore = create<StoreState>()(
    persist(
        (set, get) => ({
            user: null,
            bookings: [],
            isAuthenticated: false,
            authToken: null,
            tests: [],
            darkMode: false,
            userRole: 'patient',
            admin: null,
            appointments: [],
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
        { 
            name: 'rahila-storage', 
            storage: createJSONStorage(() => sessionStorage),
            // SECURITY/PERFORMANCE: Only persist auth and lightweight state to avoid massive sessionStorage bloat
            partialize: (state) => ({ 
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                authToken: state.authToken,
                darkMode: state.darkMode,
                userRole: state.userRole,
                admin: state.admin,
                isSidebarOpen: state.isSidebarOpen
            })
        }
    )
)
