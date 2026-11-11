export type UserRole = 'admin' | 'lecturer' | 'student' | string

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  department?: string | null
  is_active?: boolean
}

export interface Lab {
  id: number
  name: string
  code: string
  building: string
  floor?: string | null
  capacity: number
  description?: string | null
  booking_mode?: 'automatic' | 'approval' | string
  is_active?: boolean
}

export type BookingStatus = 'confirmed' | 'pending' | 'rejected' | 'cancelled' | string

export interface Booking {
  id: number
  booking_reference: string
  user_id?: number
  lab_id: number
  subject: string
  purpose: string
  start_at: string
  end_at: string
  status: BookingStatus
  expected_students?: number | null
  notes?: string | null
  special_event?: boolean
  approval_reason?: string | null
  created_at?: string
  lab?: Lab
  user?: User
}

export interface LabStatusResponse {
  lab: Lab
  status: 'available' | 'in_session' | 'maintenance' | string
  current?: { start_at: string; end_at: string } | null
  next?: { start_at: string; end_at: string } | null
}
