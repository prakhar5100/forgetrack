import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Edit2, Trash2, ExternalLink, Play } from 'lucide-react'
import api, { MuscleGroup, Exercise } from '../lib/api'

function ExerciseCard({ ex, onEdit, onDelete, onClick }: { ex: Exercise; onEdit: () => void; onDelete: () => void; onClick: () => void }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-border/80 transition-all group cursor-pointer" onClick={onClick}>
      {ex.image_url ? (
        <img src={ex.image_url} alt={ex.name} className="w-full h-36 object-cover" />
      ) : (
        <div className="w-full h-36 bg-surface flex items-center justify-center">
          <span className="text-4xl opacity-30">🏋️</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-600 text-sm text-text leading-tight">{ex.name}</h3>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-accent/20 text-muted hover:text-accent transition-colors"><Edit2 size={13} /></button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: ex.muscle_group?.color_hex + '22', color: ex.muscle_group?.color_hex }}>
            {ex.muscle_group?.name}
          </span>
          {ex.equipment && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-border/50 text-muted">{ex.equipment}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function ExerciseForm({ exercise, muscleGroups, onClose, onSave }: {
  exercise?: Exercise; muscleGroups: MuscleGroup[]; onClose: () => void; onSave: (data: FormData) => void
}) {
  const [name, setName] = useState(exercise?.name ?? '')
  const [mgId, setMgId] = useState(exercise?.muscle_group_id ?? muscleGroups[0]?.id ?? 1)
  const [equipment, setEquipment] = useState(exercise?.equipment ?? '')
  const [muscles, setMuscles] = useState(exercise?.primary_muscles ?? '')
  const [cues, setCues] = useState(exercise?.cues ?? '')
  const [videoUrl, setVideoUrl] = useState(exercise?.video_url ?? '')
  const [refLink, setRefLink] = useState(exercise?.reference_link ?? '')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('name', name)
    fd.append('muscle_group_id', String(mgId))
    if (equipment) fd.append('equipment', equipment)
    if (muscles) fd.append('primary_muscles', muscles)
    if (cues) fd.append('cues', cues)
    if (videoUrl) fd.append('video_url', videoUrl)
    if (refLink) fd.append('reference_link', refLink)
    if (imageFile) fd.append('image', imageFile)
    onSave(fd)
  }

  const inputClass = "w-full bg-bg border border-border rounded-xl px-4 py-3 text-text text-sm focus:border-accent focus:outline-none placeholder:text-muted/40"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 slide-over-backdrop">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display font-700 text-lg text-text">{exercise ? 'Edit Exercise' : 'New Exercise'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-card text-muted hover:text-text transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Goblet Squat" className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">Muscle Group *</label>
            <select value={mgId} onChange={e => setMgId(Number(e.target.value))} className={inputClass}>
              {muscleGroups.map(mg => <option key={mg.id} value={mg.id}>{mg.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">Equipment</label>
              <input value={equipment} onChange={e => setEquipment(e.target.value)} placeholder="Dumbbells" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">Primary Muscles</label>
              <input value={muscles} onChange={e => setMuscles(e.target.value)} placeholder="Quads, Glutes" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">Cues / Notes</label>
            <textarea value={cues} onChange={e => setCues(e.target.value)} rows={3} placeholder="Keep chest up, knees tracking toes..." className={inputClass + ' resize-none'} />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">Video URL (YouTube or other)</label>
            <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">Reference Link</label>
            <input value={refLink} onChange={e => setRefLink(e.target.value)} placeholder="https://..." className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">Image</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent/20 file:text-accent file:text-sm file:cursor-pointer hover:file:bg-accent/30" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-card border border-border text-muted text-sm hover:text-text transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-accent text-white font-display font-600 text-sm glow-accent hover:bg-accent/90 transition-all">
              {exercise ? 'Save Changes' : 'Add Exercise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ExerciseDetail({ ex, onClose }: { ex: Exercise; onClose: () => void }) {
  const isYoutube = ex.video_url?.includes('youtube') || ex.video_url?.includes('youtu.be')
  const getYoutubeEmbed = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : null
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 slide-over-backdrop" onClick={onClose} />
      <div className="w-full max-w-md bg-surface border-l border-border flex flex-col animate-slide-in overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display font-700 text-xl text-text">{ex.name}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-card text-muted transition-colors"><X size={20} /></button>
        </div>

        {ex.image_url && <img src={ex.image_url} alt={ex.name} className="w-full h-52 object-cover" />}

        <div className="p-5 space-y-5">
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm px-3 py-1 rounded-full font-medium" style={{ background: ex.muscle_group?.color_hex + '22', color: ex.muscle_group?.color_hex }}>
              {ex.muscle_group?.icon} {ex.muscle_group?.name}
            </span>
            {ex.equipment && <span className="text-sm px-3 py-1 rounded-full bg-card border border-border text-muted">{ex.equipment}</span>}
          </div>

          {ex.primary_muscles && (
            <div>
              <p className="text-xs text-muted uppercase tracking-wider mb-1.5">Primary Muscles</p>
              <p className="text-sm text-text">{ex.primary_muscles}</p>
            </div>
          )}

          {ex.cues && (
            <div>
              <p className="text-xs text-muted uppercase tracking-wider mb-2">Coaching Cues</p>
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-sm text-text leading-relaxed">{ex.cues}</p>
              </div>
            </div>
          )}

          {ex.video_url && (
            <div>
              <p className="text-xs text-muted uppercase tracking-wider mb-2">Video</p>
              {isYoutube && getYoutubeEmbed(ex.video_url) ? (
                <div className="rounded-xl overflow-hidden">
                  <iframe
                    src={getYoutubeEmbed(ex.video_url)!}
                    className="w-full aspect-video"
                    allowFullScreen
                    title={ex.name}
                  />
                </div>
              ) : (
                <a href={ex.video_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-xl text-sm text-accent hover:bg-card/80 transition-colors">
                  <Play size={16} /> Watch Video
                </a>
              )}
            </div>
          )}

          {ex.reference_link && (
            <a href={ex.reference_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-xl text-sm text-muted hover:text-text transition-colors">
              <ExternalLink size={15} /> Reference Link
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Exercises() {
  const qc = useQueryClient()
  const [selectedMG, setSelectedMG] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editExercise, setEditExercise] = useState<Exercise | null>(null)
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null)
  const [search, setSearch] = useState('')

  const { data: muscleGroups } = useQuery<MuscleGroup[]>({
    queryKey: ['muscle-groups'],
    queryFn: () => api.get('/muscle-groups').then(r => r.data),
  })

  const { data: exercises, isLoading } = useQuery<Exercise[]>({
    queryKey: ['exercises', selectedMG, 'all'],
    queryFn: () => api.get(`/exercises${selectedMG ? `?muscle_group_id=${selectedMG}` : ''}`).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (fd: FormData) => api.post('/exercises', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exercises'] }); setFormOpen(false) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }: { id: number; fd: FormData }) =>
      api.put(`/exercises/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exercises'] }); setEditExercise(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/exercises/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  })

  const filtered = exercises?.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase())) ?? []

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display font-800 text-3xl text-text">Exercise Library</h1>
          <p className="text-muted mt-1">{exercises?.length ?? 0} exercises</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white font-display font-600 text-sm glow-accent hover:bg-accent/90 transition-all"
        >
          <Plus size={16} /> Add Exercise
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search exercises..."
          className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none w-56"
        />
        <button
          onClick={() => setSelectedMG(null)}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${!selectedMG ? 'bg-accent/15 border border-accent/20 text-accent' : 'bg-card border border-border text-muted hover:text-text'}`}
        >
          All
        </button>
        {muscleGroups?.map(mg => (
          <button
            key={mg.id}
            onClick={() => setSelectedMG(mg.id === selectedMG ? null : mg.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
              selectedMG === mg.id ? 'border text-text' : 'bg-card border border-border text-muted hover:text-text'
            }`}
            style={selectedMG === mg.id ? { background: mg.color_hex + '20', borderColor: mg.color_hex + '50', color: mg.color_hex } : {}}
          >
            {mg.icon} {mg.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="shimmer-bg h-36" />
              <div className="p-4 space-y-2">
                <div className="shimmer-bg h-4 rounded w-3/4" />
                <div className="shimmer-bg h-3 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(ex => (
            <ExerciseCard
              key={ex.id}
              ex={ex}
              onClick={() => setDetailExercise(ex)}
              onEdit={() => setEditExercise(ex)}
              onDelete={() => { if (confirm(`Remove "${ex.name}"?`)) deleteMutation.mutate(ex.id) }}
            />
          ))}
        </div>
      )}

      {(formOpen || editExercise) && muscleGroups && (
        <ExerciseForm
          exercise={editExercise ?? undefined}
          muscleGroups={muscleGroups}
          onClose={() => { setFormOpen(false); setEditExercise(null) }}
          onSave={(fd) => editExercise ? updateMutation.mutate({ id: editExercise.id, fd }) : createMutation.mutate(fd)}
        />
      )}

      {detailExercise && <ExerciseDetail ex={detailExercise} onClose={() => setDetailExercise(null)} />}
    </div>
  )
}
