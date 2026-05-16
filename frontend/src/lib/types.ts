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
