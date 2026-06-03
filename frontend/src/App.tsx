import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Progress from './pages/Progress'
import Exercises from './pages/Exercises'
import History from './pages/History'
import ProgressPhotos from './pages/ProgressPhotos'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  if (!ready) return null

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="progress" element={<Progress />} />
        <Route path="exercises" element={<Exercises />} />
        <Route path="history" element={<History />} />
        <Route path="photos" element={<ProgressPhotos />} />
      </Route>
    </Routes>
  )
}
