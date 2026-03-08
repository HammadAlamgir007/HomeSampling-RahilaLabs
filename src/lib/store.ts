/**
 * Backward-compatible barrel re-export.
 * The actual store lives in store/app-store.ts
 * Existing imports of `@/lib/store` continue to work.
 */
export { useStore } from '@/store/app-store'
export type { UserRole, User, Admin, Test, Booking, Appointment, Report } from '@/types'
