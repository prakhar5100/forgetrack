import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, ChevronRight, ChevronLeft, Check, Plus, Upload, Dumbbell, Search } from 'lucide-react'
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

// ─── Add Exercise Sub-form ─────────────────────────────────────────────────────
function AddExerciseForm({
  muscleGroupId,
  muscleGroups,
  onCreated,
  onCancel,
}: {
  muscleGroupId: number | null
  muscleGroups: MuscleGroup[] | undefined
  onCreated: (ex: Exercise) => void
  onCancel: () => void
}) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [mgId, setMgId] = useState<number>(muscleGroupId ?? 0)
  const [equipment, setEquipment] = useState('')
  const [cues, setCues] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData()
      fd.append('name', name.trim())
      fd.append('muscle_group_id', String(mgId))
      if (equipment.trim()) fd.append('equipment', equipment.trim())
      if (cues.trim()) fd.append('cues', cues.trim())
      if (imageFile) fd.append('image', imageFile)
      const res = await api.post('/exercises', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data as Exercise
    },
    onSuccess: (ex) => {
      qc.invalidateQueries({ queryKey: ['exercises'] })
      onCreated(ex)
    },
  })

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
          <Dumbbell size={16} className="text-accent" />
        </div>
        <div>
          <div className="text-sm font-semibold text-text">New Exercise</div>
          <div className="text-xs text-muted">Fill in the details below</div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">
          Exercise Name <span className="text-accent">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Incline Dumbbell Press"
          className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none placeholder:text-muted/50"
        />
      </div>

      {/* Muscle Group */}
      <div>
        <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">
          Muscle Group <span className="text-accent">*</span>
        </label>
        <select
          value={mgId}
          onChange={e => setMgId(Number(e.target.value))}
          className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none"
        >
          <option value={0} disabled>Select muscle group…</option>
          {muscleGroups?.map(mg => (
            <option key={mg.id} value={mg.id}>{mg.icon} {mg.name}</option>
          ))}
        </select>
      </div>

      {/* Equipment */}
      <div>
        <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">Equipment</label>
        <input
          type="text"
          value={equipment}
          onChange={e => setEquipment(e.target.value)}
          placeholder="e.g. Barbell, Dumbbells, Bodyweight"
          className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none placeholder:text-muted/50"
        />
      </div>

      {/* Coaching Cues */}
      <div>
        <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">Coaching Cues</label>
        <textarea
          value={cues}
          onChange={e => setCues(e.target.value)}
          placeholder="Key form tips…"
          rows={2}
          className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-text text-sm focus:border-accent focus:outline-none resize-none placeholder:text-muted/50"
        />
      </div>

      {/* Image upload */}
      <div>
        <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">Image (optional)</label>
        <div
          className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {imagePreview ? (
            <img src={imagePreview} alt="preview" className="w-full h-24 object-cover rounded-lg" />
          ) : (
            <>
              <Upload size={20} className="text-muted" />
              <span className="text-xs text-muted">Click to upload image</span>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
      </div>

      {mutation.isError && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          Failed to create exercise. Please try again.
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-card text-muted hover:text-text border border-border transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={!name.trim() || !mgId || mutation.isPending}
          className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? 'Creating…' : 'Create Exercise'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Modal ────────────────────────────────────────────────────────────────
export default function LogWorkoutModal({ onClose }: Props) {
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
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState('')

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
        setStep(1)
        setExerciseId(null)
        setSets('3')
        setReps('10')
        setWeight('0')
        setFormRating('')
        setEnergyLevel('')
        setNotes('')
      }, 1500)
    },
  })

  const selectedExercise = exercises?.find(e => e.id === exerciseId)
  const selectedMG = muscleGroups?.find(m => m.id === muscleGroupId)
  const isTimeBased =
    selectedExercise?.name.toLowerCase().includes('plank') ||
    selectedExercise?.name.toLowerCase().includes('hold')
  const volume =
    unit === 'BW'
      ? 0
      : parseFloat(sets || '0') *
        parseFloat(reps || '0') *
        parseFloat(weight || '0') *
        (unit === 'lb' ? 0.453592 : 1)

  const filteredExercises = exercises?.filter(ex =>
    ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())
  )

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      {/* Modal container — stop propagation so clicking inside doesn't close */}
      <div
        className="w-full max-w-lg bg-surface border border-border rounded-2xl flex flex-col shadow-2xl modal-enter"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
              <Dumbbell size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="font-display font-700 text-lg text-text">Log Workout</h2>
              <p className="text-xs text-muted">{STEP_LABELS[step]}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-card text-muted hover:text-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step progress bar */}
        <div className="flex px-6 pt-4 gap-1.5 shrink-0">
          {STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i < step ? 'bg-accent' : i === step ? 'bg-accent/70' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 relative">

          {/* ── STEP 0: Date + Muscle Group ── */}
          {step === 0 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Date</label>
                <input
                  id="log-date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text focus:border-accent focus:outline-none font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted uppercase tracking-wider mb-3 block">Muscle Group</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {muscleGroups?.map(mg => (
                    <button
                      key={mg.id}
                      id={`mg-${mg.id}`}
                      onClick={() => setMuscleGroupId(mg.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all font-medium text-sm text-left ${
                        muscleGroupId === mg.id
                          ? 'text-text'
                          : 'border-border text-muted hover:text-text'
                      }`}
                      style={
                        muscleGroupId === mg.id
                          ? {
                              borderColor: mg.color_hex,
                              background: mg.color_hex + '18',
                            }
                          : {}
                      }
                    >
                      <span className="text-xl">{mg.icon}</span>
                      <span>{mg.name}</span>
                      {muscleGroupId === mg.id && (
                        <div
                          className="ml-auto w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: mg.color_hex }}
                        >
                          <Check size={11} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {!muscleGroups?.length && (
                  <div className="text-center py-6 text-muted text-sm">Loading muscle groups…</div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 1: Exercise ── */}
          {step === 1 && (
            <div className="animate-fade-in space-y-3">
              {/* Context pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: selectedMG?.color_hex }}
                  />
                  <span className="text-sm text-muted">{selectedMG?.name}</span>
                </div>
                <button
                  id="add-exercise-btn"
                  onClick={() => setShowAddExercise(true)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 transition-colors font-medium"
                >
                  <Plus size={13} /> Add Exercise
                </button>
              </div>

              {/* Add exercise sub-form */}
              {showAddExercise ? (
                <AddExerciseForm
                  muscleGroupId={muscleGroupId}
                  muscleGroups={muscleGroups}
                  onCreated={ex => {
                    setShowAddExercise(false)
                    setExerciseId(ex.id)
                  }}
                  onCancel={() => setShowAddExercise(false)}
                />
              ) : (
                <>
                  {/* Search */}
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={exerciseSearch}
                      onChange={e => setExerciseSearch(e.target.value)}
                      placeholder="Search exercises…"
                      className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text focus:border-accent focus:outline-none placeholder:text-muted/50"
                    />
                  </div>

                  {/* Exercise list */}
                  <div className="space-y-2">
                    {filteredExercises?.length === 0 && (
                      <div className="text-center py-8 text-muted text-sm">
                        No exercises found.{' '}
                        <button
                          className="text-accent underline"
                          onClick={() => setShowAddExercise(true)}
                        >
                          Create one?
                        </button>
                      </div>
                    )}
                    {filteredExercises?.map(ex => (
                      <button
                        key={ex.id}
                        id={`ex-${ex.id}`}
                        onClick={() => setExerciseId(ex.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          exerciseId === ex.id
                            ? 'border-accent bg-accent/10'
                            : 'border-border hover:border-border/80 hover:bg-card'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium text-text text-sm">{ex.name}</div>
                            {ex.equipment && (
                              <div className="text-xs text-muted mt-0.5">{ex.equipment}</div>
                            )}
                          </div>
                          {exerciseId === ex.id && (
                            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                              <Check size={11} className="text-white" />
                            </div>
                          )}
                        </div>
                        {ex.image_url && (
                          <img
                            src={ex.image_url}
                            alt={ex.name}
                            className="mt-2.5 w-full h-20 object-cover rounded-lg opacity-60"
                          />
                        )}
                      </button>
                    ))}
                    {!exercises && (
                      <div className="text-center py-6 text-muted text-sm">Loading exercises…</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── STEP 2: Sets, Reps, Weight ── */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              {/* Exercise context card */}
              <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
                <div
                  className="w-2 rounded-full self-stretch shrink-0"
                  style={{ background: selectedMG?.color_hex }}
                />
                <div>
                  <div className="text-sm font-semibold text-text">{selectedExercise?.name}</div>
                  <div className="text-xs text-muted mt-0.5">{selectedMG?.name}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Sets', value: sets, setter: setSets },
                  { label: isTimeBased ? 'Seconds' : 'Reps', value: reps, setter: setReps },
                  { label: 'Weight', value: weight, setter: setWeight, step: 0.5, disabled: unit === 'BW' },
                ].map(({ label, value, setter, step: s, disabled }) => (
                  <div key={label}>
                    <label className="text-xs text-muted uppercase tracking-wider mb-2 block">{label}</label>
                    <input
                      type="number"
                      value={value}
                      onChange={e => setter(e.target.value)}
                      min="0"
                      step={s ?? 1}
                      disabled={disabled}
                      className="w-full bg-card border border-border rounded-xl px-3 py-3 text-text text-center text-lg font-mono font-medium focus:border-accent focus:outline-none disabled:opacity-40"
                    />
                  </div>
                ))}
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
                        unit === u
                          ? 'bg-accent text-white'
                          : 'bg-card text-muted border border-border hover:text-text'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume preview */}
              {unit !== 'BW' && parseFloat(weight) > 0 && (
                <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-between">
                  <span className="text-xs text-accent/70 uppercase tracking-wider">Total Volume</span>
                  <span className="font-mono font-600 text-accent">{volume.toFixed(1)} kg</span>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Form + Notes ── */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="text-xs text-muted uppercase tracking-wider mb-3 block">Form Rating</label>
                <div className="grid grid-cols-4 gap-2">
                  {FORM_EMOJIS.map(({ value, emoji, label }) => (
                    <button
                      key={value}
                      id={`form-${value}`}
                      onClick={() => setFormRating(formRating === value ? '' : value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        formRating === value ? 'border-accent bg-accent/10' : 'border-border hover:border-border/60'
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
                      id={`energy-${value}`}
                      onClick={() => setEnergyLevel(energyLevel === value ? '' : value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        energyLevel === value ? 'border-accent bg-accent/10' : 'border-border hover:border-border/60'
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
                  id="log-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="How did it feel?"
                  rows={3}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text text-sm focus:border-accent focus:outline-none resize-none placeholder:text-muted/50"
                />
              </div>
            </div>
          )}

          {/* ── Success overlay ── */}
          {success && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/90 backdrop-blur-sm rounded-b-2xl animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-4">
                  <Check size={30} className="text-green-400" />
                </div>
                <div className="font-display font-700 text-xl text-text">Logged! 🎉</div>
                <div className="text-sm text-muted mt-1">Select your next exercise</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {!showAddExercise && (
          <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-card text-muted hover:text-text border border-border transition-colors text-sm"
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}

            {step < 3 ? (
              <button
                id="log-next-btn"
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-display font-600 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                id="log-save-btn"
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-display font-600 text-sm transition-all disabled:opacity-60 glow-accent"
              >
                {mutation.isPending ? 'Saving…' : '💾 Save Workout'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
