import axios from 'axios'

// In production (Vercel), VITE_API_URL points to the Render backend.
// In local dev, it's unset → Vite proxy forwards /api → localhost:8000.
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({ baseURL: BASE })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// Types
export interface MuscleGroup {
  id: number
  name: string
  color_hex: string
  icon?: string
}

export interface Exercise {
  id: number
  name: string
  muscle_group_id: number
  equipment?: string
  primary_muscles?: string
  cues?: string
  image_url?: string
  video_url?: string
  reference_link?: string
  is_active: boolean
  muscle_group?: MuscleGroup
}

export interface WorkoutLog {
  id: number
  date: string
  week_number: number
  muscle_group_id: number
  exercise_id: number
  sets: number
  reps: number
  weight_kg: number
  unit: 'kg' | 'lb' | 'BW'
  form_rating?: 'great' | 'good' | 'okay' | 'poor'
  energy_level?: 'high' | 'medium' | 'low'
  notes?: string
  total_volume_kg: number
  muscle_group?: MuscleGroup
  exercise?: Exercise
}

export interface PaginatedLogs {
  items: WorkoutLog[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface DashboardSummary {
  total_volume_week: number
  sessions_week: number
  streak: number
  total_sessions_all_time: number
  muscle_group_last_trained: Array<{
    id: number
    name: string
    color_hex: string
    icon?: string
    last_trained: string | null
    days_since: number | null
  }>
}

export interface ProgressPhoto {
  id: number
  date: string
  image_url: string
  weight_kg?: number
  notes?: string
}
