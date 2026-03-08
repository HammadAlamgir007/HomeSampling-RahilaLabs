/**
 * Global constants used across the Next.js frontend.
 */

export const TIME_SLOTS = [
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM',
] as const

export const STATES = [
    'Punjab',
    'Sindh',
    'Khyber Pakhtunkhwa',
    'Balochistan',
    'Islamabad Capital Territory',
    'Gilgit-Baltistan',
    'Azad Jammu and Kashmir',
] as const

export const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    approved: 'bg-blue-100 text-blue-800',       // alias for confirmed
    collected: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    ready: 'bg-green-100 text-green-800',         // alias for completed
    cancelled: 'bg-red-100 text-red-800',
    declined: 'bg-red-100 text-red-800',          // alias
}
