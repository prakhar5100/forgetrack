import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Trash2, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import api, { MuscleGroup, Exercise, PaginatedLogs } from '../lib/api'

export default function History() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [filterMG, setFilterMG] = useState('')
  const [filterEx, setFilterEx] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const { data: muscleGroups } = useQuery<MuscleGroup[]>({
    queryKey: ['muscle-groups'],
    queryFn: () => api.get('/muscle-groups').then(r => r.data),
  })

  const { data: exercises } = useQuery<Exercise[]>({
    queryKey: ['exercises', filterMG],
    queryFn: () => api.get(`/exercises${filterMG ? `?muscle_group_id=${filterMG}` : ''}`).then(r => r.data),
  })

  const params = new URLSearchParams({ page: String(page), limit: '20' })
  if (filterMG) params.set('muscle_group_id', filterMG)
  if (filterEx) params.set('exercise_id', filterEx)
  if (filterDateFrom) params.set('date', filterDateFrom)

  const { data: logs, isLoading } = useQuery<PaginatedLogs>({
    queryKey: ['logs', { page, filterMG, filterEx, filterDateFrom }],
    queryFn: () => api.get(`/logs?${params}`).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/logs/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['logs'] }); qc.invalidateQueries({ queryKey: ['summary'] }) },
  })

  const exportCSV = () => {
    if (!logs?.items) return
    const headers = ['Date', 'Week', 'Muscle Group', 'Exercise', 'Sets', 'Reps', 'Weight', 'Unit', 'Volume (kg)', 'Form', 'Energy', 'Notes']
    const rows = logs.items.map(l => [
      l.date, l.week_number, l.muscle_group?.name, l.exercise?.name,
      l.sets, l.reps, l.weight_kg, l.unit, l.total_volume_kg.toFixed(1),
      l.form_rating || '', l.energy_level || '', l.notes || ''
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'workout-history.csv'; a.click()
  }

  const inputClass = "bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none"

  const formEmoji = (r?: string) => ({ great: '🔥', good: '💪', okay: '😐', poor: '😓' }[r || ''] || '')
  const energyEmoji = (e?: string) => ({ high: '⚡', medium: '🌤', low: '😴' }[e || ''] || '')

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display font-800 text-3xl text-text">History</h1>
          <p className="text-muted mt-1">{logs?.total ?? 0} total entries</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-muted hover:text-text text-sm transition-colors"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterMG} onChange={e => { setFilterMG(e.target.value); setFilterEx(''); setPage(1) }} className={inputClass}>
          <option value="">All Muscle Groups</option>
          {muscleGroups?.map(mg => <option key={mg.id} value={mg.id}>{mg.name}</option>)}
        </select>
        <select value={filterEx} onChange={e => { setFilterEx(e.target.value); setPage(1) }} className={inputClass}>
          <option value="">All Exercises</option>
          {exercises?.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setPage(1) }} className={inputClass} />
        </div>
        {(filterMG || filterEx || filterDateFrom) && (
          <button
            onClick={() => { setFilterMG(''); setFilterEx(''); setFilterDateFrom(''); setFilterDateTo(''); setPage(1) }}
            className="px-3 py-2.5 text-sm text-muted hover:text-text transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Date', 'Muscle', 'Exercise', 'Sets×Reps', 'Weight', 'Volume', 'Form', 'Energy', 'Notes', ''].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs text-muted uppercase tracking-wider font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="shimmer-bg h-4 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : logs?.items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted">No workouts found</td>
                </tr>
              ) : (
                logs?.items.map((log, i) => (
                  <tr key={log.id} className={`border-b border-border/40 hover:bg-surface/50 transition-colors ${i % 2 === 0 ? '' : 'bg-surface/20'}`}>
                    <td className="px-4 py-3 text-sm font-mono text-muted whitespace-nowrap">{format(new Date(log.date), 'MMM d, yy')}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap" style={{ background: log.muscle_group?.color_hex + '22', color: log.muscle_group?.color_hex }}>
                        {log.muscle_group?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text font-medium whitespace-nowrap">{log.exercise?.name}</td>
                    <td className="px-4 py-3 text-sm font-mono text-text">{log.sets}×{log.reps}</td>
                    <td className="px-4 py-3 text-sm font-mono text-text">{log.weight_kg}{log.unit}</td>
                    <td className="px-4 py-3 text-sm font-mono text-accent">{log.total_volume_kg.toFixed(0)}</td>
                    <td className="px-4 py-3 text-sm">{formEmoji(log.form_rating)}</td>
                    <td className="px-4 py-3 text-sm">{energyEmoji(log.energy_level)}</td>
                    <td className="px-4 py-3 text-xs text-muted max-w-[150px] truncate">{log.notes}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { if (confirm('Delete this log?')) deleteMutation.mutate(log.id) }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logs && logs.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted">Page {logs.page} of {logs.pages} · {logs.total} entries</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg bg-card border border-border text-muted hover:text-text disabled:opacity-40 transition-colors">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setPage(p => Math.min(logs.pages, p + 1))} disabled={page === logs.pages}
                className="p-2 rounded-lg bg-card border border-border text-muted hover:text-text disabled:opacity-40 transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
