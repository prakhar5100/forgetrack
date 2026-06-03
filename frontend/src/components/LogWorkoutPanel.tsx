import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import api, { MuscleGroup, Exercise } from '../lib/api'
import { format } from 'date-fns'

interface Props {
  onClose: () => void
}

const STEP_LABELS = ['Date & Muscle', 'Exercise', 'Sets & Reps', 'Rating & Notes']

const FORM_EMOJIS = [
  { value: 'great', emoji: '🔥', label: 'Great' },
  { value: 'good', emoji: '💪', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'poor', emoji: '😓', label: 'Poor' },
]

const ENERGY_EMOJIS = [
  { value: 'high', emoji: '⚡', label: 'High' },
  { value: 'medium', emoji: '🌤', label: 'Medium' },
  { value: 'low', emoji: '😴', label: 'Low' },
]

export default function LogWorkoutPanel({ onClose }: Props) {
  const qc = useQueryClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [step, setStep] = useState(0)
  const [date, setDate] = useState(today)
  const [muscleGroupId, setMuscleGroupId] = useState<number | null>(null)
  const [exerciseId, setExerciseId] = useState<number | null>(null)
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('10')
  const [weight, setWeight] = useState('0')
  const [unit, setUnit] = useState<'kg' | 'lb' | 'BW'>('kg')
  const [formRating, setFormRating] = useState<string>('')
  const [energyLevel, setEnergyLevel] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [success, setSuccess] = useState(false)

  const { data: muscleGroups } = useQuery<MuscleGroup[]>({
    queryKey: ['muscle-groups'],
    queryFn: () => api.get('/muscle-groups').then(r => r.data),
  })

  const { data: exercises } = useQuery<Exercise[]>({
    queryKey: ['exercises', muscleGroupId],
    queryFn: () => api.get(`/exercises?muscle_group_id=${muscleGroupId}`).then(r => r.data),
    enabled: !!muscleGroupId,
  })

  const mutation = useMutation({
    mutationFn: (body: object) => api.post('/logs', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['logs'] })
      qc.invalidateQueries({ queryKey: ['summary'] })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        // Reset to step 1 (exercise selection) for quick next log
        setStep(1)
        setExerciseId(null)
        setSets('3')
        setReps('10')
        setWeight('0')
        setFormRating('')
        setEnergyLevel('')
        setNotes('')
      }, 1200)
    },
  })

  const selectedExercise = exercises?.find(e => e.id === exerciseId)
  const selectedMG = muscleGroups?.find(m => m.id === muscleGroupId)
  const isTimeBased = selectedExercise?.name.toLowerCase().includes('plank') || selectedExercise?.name.toLowerCase().includes('hold')
  const volume = unit === 'BW' ? 0 : parseFloat(sets || '0') * parseFloat(reps || '0') * parseFloat(weight || '0') * (unit === 'lb' ? 0.453592 : 1)

  const handleSubmit = () => {
    if (!exerciseId || !muscleGroupId) return
    mutation.mutate({
      date,
      muscle_group_id: muscleGroupId,
      exercise_id: exerciseId,
      sets: parseInt(sets),
      reps: parseInt(reps),
      weight_kg: parseFloat(weight),
      unit,
      form_rating: formRating || undefined,
      energy_level: energyLevel || undefined,
      notes: notes || undefined,
    })
  }

  const canNext = () => {
    if (step === 0) return !!muscleGroupId && !!date
    if (step === 1) return !!exerciseId
    if (step === 2) return parseInt(sets) > 0 && parseInt(reps) > 0
    return true
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60 slide-over-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-md bg-surface border-l border-border flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-display font-700 text-xl text-text">Log Workout</h2>
            <p className="text-xs text-muted mt-0.5">{STEP_LABELS[step]}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-card text-muted hover:text-text transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-5 pt-4 gap-2">
          {STEP_LABELS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-accent' : 'bg-border'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* STEP 0: Date + Muscle Group */}
          {step === 0 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text focus:border-accent focus:outline-none font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted uppercase tracking-wider mb-3 block">Muscle Group</label>
                <div className="grid grid-cols-2 gap-3">
                  {muscleGroups?.map(mg => (
                    <button
                      key={mg.id}
                      onClick={() => setMuscleGroupId(mg.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all font-medium text-sm ${
                        muscleGroupId === mg.id
                          ? 'border-[var(--mg-color)] bg-[var(--mg-color)]/10 text-text'
                          : 'border-border text-muted hover:border-[var(--mg-color)]/50 hover:text-text'
                      }`}
                      style={{ '--mg-color': mg.color_hex } as React.CSSProperties}
                    >
                      <span className="text-lg">{mg.icon}</span>
                      {mg.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Exercise */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ background: selectedMG?.color_hex }} />
                <span className="text-sm text-muted">{selectedMG?.name}</span>
              </div>
              <div className="space-y-2">
                {exercises?.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => setExerciseId(ex.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      exerciseId === ex.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-border/80 hover:bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-text text-sm">{ex.name}</div>
                        {ex.equipment && (
                          <div className="text-xs text-muted mt-1">{ex.equipment}</div>
                        )}
                      </div>
                      {exerciseId === ex.id && (
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0 ml-2">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    {ex.image_url && (
                      <img
                        src={ex.image_url}
                        alt={ex.name}
                        className="mt-3 w-full h-24 object-cover rounded-lg opacity-60"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Sets, Reps, Weight */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="text-sm font-medium text-text">{selectedExercise?.name}</div>
                <div className="text-xs text-muted mt-1">{selectedMG?.name}</div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Sets</label>
                  <input
                    type="number"
                    value={sets}
                    onChange={e => setSets(e.target.value)}
                    min="1"
                    className="w-full bg-card border border-border rounded-xl px-3 py-3 text-text text-center text-lg font-mono font-medium focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider mb-2 block">{isTimeBased ? 'Seconds' : 'Reps'}</label>
                  <input
                    type="number"
                    value={reps}
                    onChange={e => setReps(e.target.value)}
                    min="1"
                    className="w-full bg-card border border-border rounded-xl px-3 py-3 text-text text-center text-lg font-mono font-medium focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Weight</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    min="0"
                    step="0.5"
                    disabled={unit === 'BW'}
                    className="w-full bg-card border border-border rounded-xl px-3 py-3 text-text text-center text-lg font-mono font-medium focus:border-accent focus:outline-none disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Unit toggle */}
              <div>
                <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Unit</label>
                <div className="flex gap-2">
                  {(['kg', 'lb', 'BW'] as const).map(u => (
                    <button
                      key={u}
                      onClick={() => setUnit(u)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        unit === u ? 'bg-accent text-white' : 'bg-card text-muted border border-border hover:text-text'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume preview */}
              {unit !== 'BW' && parseFloat(weight) > 0 && (
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-between">
                  <span className="text-xs text-accent/70 uppercase tracking-wider">Total Volume</span>
                  <span className="font-mono font-600 text-accent">{volume.toFixed(1)} kg</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Form + Notes */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="text-xs text-muted uppercase tracking-wider mb-3 block">Form Rating</label>
                <div className="grid grid-cols-4 gap-2">
                  {FORM_EMOJIS.map(({ value, emoji, label }) => (
                    <button
                      key={value}
                      onClick={() => setFormRating(formRating === value ? '' : value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        formRating === value ? 'border-accent bg-accent/10' : 'border-border hover:border-border/80'
                      }`}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <span className="text-xs text-muted">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted uppercase tracking-wider mb-3 block">Energy Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {ENERGY_EMOJIS.map(({ value, emoji, label }) => (
                    <button
                      key={value}
                      onClick={() => setEnergyLevel(energyLevel === value ? '' : value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        energyLevel === value ? 'border-accent bg-accent/10' : 'border-border hover:border-border/80'
                      }`}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <span className="text-xs text-muted">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="How did it feel?"
                  rows={3}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text text-sm focus:border-accent focus:outline-none resize-none placeholder:text-muted"
                />
              </div>
            </div>
          )}

          {/* Success state */}
          {success && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/80 backdrop-blur">
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-green-400" />
                </div>
                <div className="font-display font-700 text-xl text-text">Logged!</div>
                <div className="text-sm text-muted mt-1">Select next exercise</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 px-4 py-3 rounded-xl bg-card text-muted hover:text-text border border-border transition-colors text-sm"
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent hover:bg-accent/90 text-white font-display font-600 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent hover:bg-accent/90 text-white font-display font-600 text-sm transition-all disabled:opacity-60 glow-accent"
            >
              {mutation.isPending ? 'Saving...' : '💾 Save Workout'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
