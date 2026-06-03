import { useQuery } from '@tanstack/react-query'
import { format, getWeek } from 'date-fns'
import { Flame, Calendar, TrendingUp, Dumbbell, Clock } from 'lucide-react'
import api, { DashboardSummary, WorkoutLog } from '../lib/api'

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`bg-card rounded-2xl p-5 border border-border relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20`} style={{ background: color }} />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
          <p className="font-display font-800 text-3xl text-text mt-1">{value}</p>
          {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: color + '22' }}>
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
    </div>
  )
}

function HeatCell({ name, icon, colorHex, lastTrained, daysSince }: {
  name: string; icon?: string; colorHex: string; lastTrained: string | null; daysSince: number | null
}) {
  const getStatus = () => {
    if (daysSince === null) return { bg: 'bg-border/30', label: 'Never', dot: '#555' }
    if (daysSince === 0) return { bg: '', label: 'Today', dot: '#22c55e' }
    if (daysSince <= 2) return { bg: '', label: `${daysSince}d ago`, dot: '#4ade80' }
    if (daysSince <= 4) return { bg: '', label: `${daysSince}d ago`, dot: '#facc15' }
    if (daysSince <= 7) return { bg: '', label: `${daysSince}d ago`, dot: '#fb923c' }
    return { bg: '', label: `${daysSince}d ago`, dot: '#ef4444' }
  }

  const { label, dot } = getStatus()

  return (
    <div
      className="bg-card rounded-xl p-4 border border-border hover:border-opacity-50 transition-all cursor-default"
      style={{ borderColor: daysSince !== null && daysSince <= 4 ? colorHex + '40' : undefined }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <div className="w-2.5 h-2.5 rounded-full mt-1" style={{ background: dot, boxShadow: `0 0 6px ${dot}` }} />
      </div>
      <div className="font-display font-600 text-sm text-text">{name}</div>
      <div className="text-xs mt-1" style={{ color: dot }}>{label}</div>
    </div>
  )
}

export default function Dashboard() {
  const today = new Date()
  const weekNum = getWeek(today)

  const { data: summary } = useQuery<DashboardSummary>({
    queryKey: ['summary'],
    queryFn: () => api.get('/stats/summary').then(r => r.data),
  })

  const { data: recentLogs } = useQuery<{ items: WorkoutLog[] }>({
    queryKey: ['logs', { limit: 10 }],
    queryFn: () => api.get('/logs?limit=10').then(r => r.data),
  })

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-800 text-3xl md:text-4xl text-text">
            {format(today, 'EEEE')} <span className="text-muted font-400">🏋️</span>
          </h1>
          <p className="text-muted mt-1">{format(today, 'MMMM d, yyyy')} · Week {weekNum}</p>
        </div>
        {summary?.streak ? (
          <div className="flex items-center gap-2 bg-accent-hot/10 border border-accent-hot/20 rounded-xl px-4 py-2">
            <Flame size={18} className="text-accent-hot" />
            <span className="font-display font-700 text-accent-hot">{summary.streak}</span>
            <span className="text-xs text-muted">day streak</span>
          </div>
        ) : null}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Volume This Week"
          value={summary ? `${(summary.total_volume_week / 1000).toFixed(1)}t` : '—'}
          sub="total kg lifted"
          color="#6C63FF"
        />
        <StatCard
          icon={<Calendar size={20} />}
          label="Sessions"
          value={summary?.sessions_week ?? '—'}
          sub="this week"
          color="#22C55E"
        />
        <StatCard
          icon={<Flame size={20} />}
          label="Streak"
          value={summary ? `${summary.streak}d` : '—'}
          sub="consecutive days"
          color="#FF4D6D"
        />
        <StatCard
          icon={<Dumbbell size={20} />}
          label="Total Sessions"
          value={summary?.total_sessions_all_time ?? '—'}
          sub="all time"
          color="#F97316"
        />
      </div>

      {/* Muscle Heatmap */}
      <div>
        <h2 className="font-display font-700 text-lg text-text mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-accent inline-block" />
          Muscle Heatmap
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {summary?.muscle_group_last_trained.map(mg => (
            <HeatCell
              key={mg.id}
              name={mg.name}
              icon={mg.icon}
              colorHex={mg.color_hex}
              lastTrained={mg.last_trained}
              daysSince={mg.days_since}
            />
          ))}
        </div>
      </div>

      {/* Recent Logs */}
      <div>
        <h2 className="font-display font-700 text-lg text-text mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-accent-hot inline-block" />
          Recent Workouts
        </h2>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {!recentLogs?.items.length ? (
            <div className="p-8 text-center text-muted">
              <Clock size={32} className="mx-auto mb-3 opacity-30" />
              <p>No workouts logged yet. Hit that + Log Workout button!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Date', 'Muscle', 'Exercise', 'Sets', 'Reps', 'Weight', 'Volume', 'Form'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-muted uppercase tracking-wider font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.items.map((log, i) => (
                    <tr key={log.id} className={`border-b border-border/50 hover:bg-surface/50 transition-colors ${i % 2 === 0 ? '' : 'bg-surface/20'}`}>
                      <td className="px-4 py-3 text-sm font-mono text-muted">{format(new Date(log.date), 'MMM d')}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: log.muscle_group?.color_hex + '22', color: log.muscle_group?.color_hex }}>
                          {log.muscle_group?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text font-medium">{log.exercise?.name}</td>
                      <td className="px-4 py-3 text-sm font-mono text-text">{log.sets}</td>
                      <td className="px-4 py-3 text-sm font-mono text-text">{log.reps}</td>
                      <td className="px-4 py-3 text-sm font-mono text-text">{log.weight_kg}{log.unit}</td>
                      <td className="px-4 py-3 text-sm font-mono text-accent">{log.total_volume_kg.toFixed(0)}</td>
                      <td className="px-4 py-3 text-sm">
                        {log.form_rating && (
                          <span>{log.form_rating === 'great' ? '🔥' : log.form_rating === 'good' ? '💪' : log.form_rating === 'okay' ? '😐' : '😓'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
