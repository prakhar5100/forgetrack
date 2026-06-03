import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Trash2, Camera } from 'lucide-react'
import { format } from 'date-fns'
import api, { ProgressPhoto } from '../lib/api'

function UploadModal({ onClose, onSave }: { onClose: () => void; onSave: (fd: FormData) => void }) {
  const [photoDate, setPhotoDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFile = (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    const fd = new FormData()
    fd.append('photo_date', photoDate)
    if (weight) fd.append('weight_kg', weight)
    if (notes) fd.append('notes', notes)
    fd.append('image', file)
    onSave(fd)
  }

  const inputClass = "w-full bg-bg border border-border rounded-xl px-4 py-3 text-text text-sm focus:border-accent focus:outline-none"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 slide-over-backdrop">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display font-700 text-lg text-text">Add Progress Photo</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-card text-muted transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Image drop zone */}
          <div
            className="relative border-2 border-dashed border-border rounded-xl overflow-hidden"
            style={{ aspectRatio: '4/3' }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFile(f) }}
          >
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-card/40 transition-colors">
                <Camera size={32} className="text-muted mb-2" />
                <span className="text-sm text-muted">Click or drag to upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </label>
            )}
            {preview && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-white text-sm font-medium">Change photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">Date</label>
              <input type="date" value={photoDate} onChange={e => setPhotoDate(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">Weight (kg)</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)} step="0.1" placeholder="Optional" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="How are you feeling?" className={inputClass + ' resize-none'} />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-card border border-border text-muted text-sm hover:text-text transition-colors">Cancel</button>
            <button type="submit" disabled={!file} className="flex-1 py-3 rounded-xl bg-accent text-white font-display font-600 text-sm glow-accent hover:bg-accent/90 disabled:opacity-40 transition-all">
              Save Photo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PhotoCard({ photo, onDelete }: { photo: ProgressPhoto; onDelete: () => void }) {
  const [full, setFull] = useState(false)

  return (
    <>
      <div className="bg-card rounded-2xl border border-border overflow-hidden group cursor-pointer" onClick={() => setFull(true)}>
        <div className="relative" style={{ aspectRatio: '3/4' }}>
          <img src={photo.image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <button
            onClick={e => { e.stopPropagation(); if (confirm('Delete this photo?')) onDelete() }}
            className="absolute top-3 right-3 p-2 rounded-xl bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <div className="p-3">
          <p className="font-mono text-sm text-text">{format(new Date(photo.date), 'MMM d, yyyy')}</p>
          {photo.weight_kg && <p className="text-xs text-muted mt-0.5">{photo.weight_kg} kg</p>}
          {photo.notes && <p className="text-xs text-muted mt-1 truncate">{photo.notes}</p>}
        </div>
      </div>

      {full && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 slide-over-backdrop" onClick={() => setFull(false)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={photo.image_url} alt="" className="w-full rounded-2xl" />
            <div className="absolute top-3 right-3">
              <button onClick={() => setFull(false)} className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors"><X size={20} /></button>
            </div>
            <div className="mt-3 text-center">
              <p className="font-mono text-white">{format(new Date(photo.date), 'MMMM d, yyyy')}</p>
              {photo.weight_kg && <p className="text-muted text-sm">{photo.weight_kg} kg</p>}
              {photo.notes && <p className="text-muted text-sm mt-1">{photo.notes}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function ProgressPhotos() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)

  const { data: photos } = useQuery<ProgressPhoto[]>({
    queryKey: ['photos'],
    queryFn: () => api.get('/progress-photos').then(r => r.data),
  })

  const uploadMutation = useMutation({
    mutationFn: (fd: FormData) => api.post('/progress-photos', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['photos'] }); setModalOpen(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/progress-photos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photos'] }),
  })

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display font-800 text-3xl text-text">Progress Photos</h1>
          <p className="text-muted mt-1">Track your physical transformation</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white font-display font-600 text-sm glow-accent hover:bg-accent/90 transition-all"
        >
          <Plus size={16} /> Add Photo
        </button>
      </div>

      {!photos?.length ? (
        <div className="flex flex-col items-center justify-center h-64 text-center bg-card rounded-2xl border border-border">
          <Camera size={48} className="text-muted mb-4 opacity-30" />
          <p className="text-text font-medium mb-1">No progress photos yet</p>
          <p className="text-muted text-sm mb-5">Document your transformation journey</p>
          <button onClick={() => setModalOpen(true)} className="px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-600 glow-accent hover:bg-accent/90 transition-all">
            Upload First Photo
          </button>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
          {photos.map(photo => (
            <div key={photo.id} className="break-inside-avoid">
              <PhotoCard photo={photo} onDelete={() => deleteMutation.mutate(photo.id)} />
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <UploadModal
          onClose={() => setModalOpen(false)}
          onSave={(fd) => uploadMutation.mutate(fd)}
        />
      )}
    </div>
  )
}
