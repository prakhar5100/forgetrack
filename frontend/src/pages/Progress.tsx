import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'
import api, { MuscleGroup, Exercise } from '../lib/api'
import { Trophy } from 'lucide-react'

const COLORS = { great: '#22c55e', good: '#6C63FF', okay: '#facc15', poor: '#ef4444' }

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-display font-700 text-base text-text mb-6">{title}</h3>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-xl p-3 text-xs">
      <p className="text-muted mb-2">Week {label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-mono font-600">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span></p>
      ))}
    </div>
  )
}

export default function Progress() {
  const [selectedMG, setSelectedMG] = useState<number | null>(null)
  const [selectedEx, setSelectedEx] = useState<number | null>(null)

  const { data: muscleGroups } = useQuery<MuscleGroup[]>({
    queryKey: ['muscle-groups'],
    queryFn: () => api.get('/muscle-groups').then(r => r.data),
  })

  const { data: exercises } = useQuery<Exercise[]>({
    queryKey: ['exercises', selectedMG],
    queryFn: () => api.get(`/exercises?muscle_group_id=${selectedMG}`).then(r => r.data),
    enabled: !!selectedMG,
  })

  const { data: weightData } = useQuery({
    queryKey: ['progress-weight', selectedEx],
    queryFn: () => api.get(`/progress/weight?exercise_id=${selectedEx}`).then(r => r.data),
    enabled: !!selectedEx,
  })

  const { data: volumeData } = useQuery({
    queryKey: ['progress-volume', selectedEx],
    queryFn: () => api.get(`/progress/volume?exercise_id=${selectedEx}`).then(r => r.data),
    enabled: !!selectedEx,
  })

  const { data: formData } = useQuery({
    queryKey: ['progress-form', selectedEx],
    queryFn: () => api.get(`/progress/form?exercise_id=${selectedEx}`).then(r => r.data),
    enabled: !!selectedEx,
  })

  const personalBest = weightData?.length ? Math.max(...weightData.map((d: any) => d.max_weight)) : null
  const selectedExercise = exercises?.find(e => e.id === selectedEx)

  const noData = selectedEx && (!weightData?.length)

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display font-800 text-3xl text-text">Progress</h1>
        <p className="text-muted mt-1">Track your strength gains over time</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filter */}
        <div className="w-52 shrink-0 space-y-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-2">Muscle Group</p>
            <div className="space-y-1">
              {muscleGroups?.map(mg => (
                <button
                  key={mg.id}
                  onClick={() => { setSelectedMG(mg.id); setSelectedEx(null) }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${
                    selectedMG === mg.id ? 'bg-card border border-border text-text' : 'text-muted hover:text-text'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: mg.color_hex }} />
                  {mg.name}
                </button>
              ))}
            </div>
          </div>

          {selectedMG && exercises && (
            <div>
              <p className="text-xs text-muted uppercase tracking-wider mb-2">Exercise</p>
              <div className="space-y-1">
                {exercises.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => setSelectedEx(ex.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                      selectedEx === ex.id ? 'bg-accent/10 border border-accent/20 text-accent' : 'text-muted hover:text-text'
                    }`}
                  >
                    {ex.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="flex-1 space-y-5">
          {!selectedEx ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-4xl mb-4">📈</div>
              <p className="text-muted">Select a muscle group and exercise to see your progress</p>
            </div>
          ) : noData ? (
            <div className="flex flex-col items-center justify-center h-64 text-center bg-card rounded-2xl border border-border">
              <div className="text-4xl mb-4">🏋️</div>
              <p className="text-text font-medium mb-1">No data yet for {selectedExercise?.name}</p>
              <p className="text-muted text-sm">Log some workouts to see your progress</p>
            </div>
          ) : (
            <>
              {/* Personal Best Banner */}
              {personalBest && (
                <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-5 py-3">
                  <Trophy size={20} className="text-yellow-400" />
                  <div>
                    <span className="text-sm text-yellow-200 font-medium">{selectedExercise?.name}</span>
                    <span className="text-sm text-yellow-400/70 ml-2">Personal Best: <span className="font-mono font-700">{personalBest}kg</span></span>
                  </div>
                </div>
              )}

              {/* Weight Chart */}
              <ChartCard title="Max Weight Per Week (kg)">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={weightData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252540" />
                    <XAxis dataKey="week" tick={{ fill: '#8888AA', fontSize: 11 }} tickFormatter={v => `W${v}`} />
                    <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    {personalBest && (
                      <ReferenceLine y={personalBest} stroke="#facc15" strokeDasharray="4 4" label={{ value: 'PB', fill: '#facc15', fontSize: 11 }} />
                    )}
                    <Line type="monotone" dataKey="max_weight" stroke="#6C63FF" strokeWidth={2.5} dot={{ fill: '#6C63FF', r: 4 }} activeDot={{ r: 6 }} name="Max Weight" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Volume Chart */}
              <ChartCard title="Total Volume Per Week (kg)">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={volumeData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252540" />
                    <XAxis dataKey="week" tick={{ fill: '#8888AA', fontSize: 11 }} tickFormatter={v => `W${v}`} />
                    <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total_volume" fill="#FF4D6D" radius={[4, 4, 0, 0]} name="Volume" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Form Chart */}
              {formData?.length > 0 && (
                <ChartCard title="Form Rating Breakdown">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={formData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#252540" />
                      <XAxis dataKey="week" tick={{ fill: '#8888AA', fontSize: 11 }} tickFormatter={v => `W${v}`} />
                      <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px', color: '#8888AA' }} />
                      <Bar dataKey="great" stackId="a" fill={COLORS.great} radius={[0, 0, 0, 0]} name="Great 🔥" />
                      <Bar dataKey="good" stackId="a" fill={COLORS.good} name="Good 💪" />
                      <Bar dataKey="okay" stackId="a" fill={COLORS.okay} name="Okay 😐" />
                      <Bar dataKey="poor" stackId="a" fill={COLORS.poor} radius={[4, 4, 0, 0]} name="Poor 😓" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
