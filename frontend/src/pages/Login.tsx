import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import api from '../lib/api'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', { username, password })
      localStorage.setItem('token', data.access_token)
      navigate('/')
    } catch {
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      {/* Background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-accent-hot/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-5 glow-accent">
            <Zap size={32} className="text-white" fill="white" />
          </div>
          <h1 className="font-display font-900 text-4xl tracking-tight">
            FORGE<span className="text-gradient">TRACK</span>
          </h1>
          <p className="text-muted text-sm mt-2">Your personal gym companion</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-text focus:border-accent focus:outline-none transition-colors placeholder:text-muted/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-text focus:border-accent focus:outline-none transition-colors placeholder:text-muted/50"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-4 rounded-xl bg-accent hover:bg-accent/90 text-white font-display font-700 text-base transition-all glow-accent disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Signing in...' : 'Enter the Forge →'}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-6">
          Default: <span className="font-mono text-accent/70">admin</span> / <span className="font-mono text-accent/70">workout</span>
        </p>
      </div>
    </div>
  )
}
