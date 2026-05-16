/**
 * Shared TypeScript types and interfaces for the frontend.
 * Domain types are co-located with their features; these are cross-cutting form/API types.
 */

// ── Form types ────────────────────────────────────────────────────────────────

export interface BookingFormData {
    tests: string[]
    addressLine1: string
    addressLine2: string
    city: string
    state: string
    zipCode: string
    date: string
    time: string
    notes?: string
}

export interface LoginFormData {
    email: string
    password: string
}

export interface RegisterFormData {
    name: string
    email: string
    password: string
    confirmPassword: string
    phone: string
    dateOfBirth: string
}

// ── User / Auth types ─────────────────────────────────────────────────────────

export type UserRole = 'patient' | 'admin' | 'staff' | 'technician'

export interface User {
    id: string
    name: string
    email: string
    phone: string
    dateOfBirth: string
    address: string
    mrn?: string
}

export interface Admin {
    id: string
    name: string
    email: string
    role: UserRole
    department?: string
}

// ── Domain types ──────────────────────────────────────────────────────────────

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
    status: 'pending' | 'approved' | 'collected' | 'ready'
    scheduledDate: string
    collectedDate?: string
    reportDate?: string
    address: string
}

export interface Appointment {
    id: string
    patientId: string
    patientName: string
    testName: string
    testId: string
    date: string
    time: string
    status: 'pending' | 'collected' | 'completed'
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
