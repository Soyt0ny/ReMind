"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { authFetch } from "@/lib/auth"
import type { Person } from "./people-list"

const RELATIONSHIPS = [
  "Esposo / Esposa",
  "Hijo / Hija",
  "Nieto / Nieta",
  "Amigo / Amiga",
  "Cuidador / Cuidadora",
  "Médico",
  "Vecino / Vecina",
  "Otro",
]

interface EditPersonFormProps {
  person: Person
  onSaved?: () => void
}

export function EditPersonForm({ person, onSaved }: EditPersonFormProps) {
  const videoRef     = useRef<HTMLVideoElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const streamRef    = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      stopCamera()
      setCapturedImage(reader.result as string)
      setMessage(null)
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const [name, setName]               = useState(person.name)
  const [relationship, setRelationship] = useState(person.relationship)
  const [age, setAge]                 = useState(person.age?.toString() ?? "")
  const [phone, setPhone]             = useState(person.phone ?? "")
  const [extra, setExtra]             = useState(person.extra ?? "")
  const [isEmergency, setIsEmergency] = useState(person.is_emergency ?? false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isCameraOn, setIsCameraOn]   = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage]         = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (isCameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [isCameraOn])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setIsCameraOn(true)
      setCapturedImage(null)
      setMessage(null)
    } catch {
      setMessage({ type: "error", text: "No se pudo acceder a la cámara." })
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setIsCameraOn(false)
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    canvas.width  = videoRef.current.videoWidth  || 640
    canvas.height = videoRef.current.videoHeight || 480
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.9))
    stopCamera()
  }, [stopCamera])

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !relationship.trim()) {
      setMessage({ type: "error", text: "Completá el nombre y la relación." })
      return
    }
    setIsSubmitting(true)
    setMessage(null)
    try {
      const body: Record<string, unknown> = {
        name:         name.trim(),
        relationship: relationship.trim(),
        age:          age   ? Number(age) : null,
        phone:        phone.trim() || null,
        extra:        extra.trim() || null,
      }
      if (capturedImage) body.image = capturedImage
      body.is_emergency = isEmergency

      const res = await authFetch(`/people/${person.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.detail || "Error al actualizar")
      }
      setMessage({ type: "success", text: `${name.trim()} actualizado exitosamente.` })
      onSaved?.()
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error al actualizar." })
    } finally {
      setIsSubmitting(false)
    }
  }, [capturedImage, name, relationship, age, phone, extra, isEmergency, person.id, onSaved])

  const displayPhoto = capturedImage ?? person.photo ?? null

  return (
    <div className="flex-1 flex flex-col w-full pb-8">
      <div className="px-4 pt-6">
        <h2 className="text-2xl font-bold mb-6 text-[#111418]">Editar persona</h2>

        <div className="flex flex-col gap-5">
          {/* Name */}
          <label className="flex flex-col gap-2">
            <span className="text-base font-medium text-[#111418] pl-1">Nombre</span>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">person</span>
              <input
                type="text"
                placeholder="ej. Juan Pérez"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white border-2 border-gray-200 rounded-xl h-14 pl-12 pr-4 text-base placeholder:text-gray-400 focus:border-[#137fec] focus:ring-0 outline-none transition-colors"
              />
            </div>
          </label>

          {/* Relationship */}
          <label className="flex flex-col gap-2">
            <span className="text-base font-medium text-[#111418] pl-1">Relación</span>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">diversity_3</span>
              <select
                value={relationship}
                onChange={e => setRelationship(e.target.value)}
                className="w-full bg-white border-2 border-gray-200 rounded-xl h-14 pl-12 pr-10 text-base text-[#111418] focus:border-[#137fec] focus:ring-0 outline-none appearance-none cursor-pointer transition-colors"
              >
                <option value="">Seleccionar relación</option>
                {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
            </div>
          </label>

          {/* Age */}
          <label className="flex flex-col gap-2">
            <span className="text-base font-medium text-[#111418] pl-1">Edad (opcional)</span>
            <input
              type="number"
              min={0}
              placeholder="ej. 72"
              value={age}
              onChange={e => setAge(e.target.value)}
              className="w-full bg-white border-2 border-gray-200 rounded-xl h-14 px-4 text-base placeholder:text-gray-400 focus:border-[#137fec] focus:ring-0 outline-none transition-colors"
            />
          </label>

          {/* Phone */}
          <label className="flex flex-col gap-2">
            <span className="text-base font-medium text-[#111418] pl-1">Teléfono (opcional)</span>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">call</span>
              <input
                type="tel"
                placeholder="ej. +54 9 11 1234-5678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-white border-2 border-gray-200 rounded-xl h-14 pl-12 pr-4 text-base placeholder:text-gray-400 focus:border-[#137fec] focus:ring-0 outline-none transition-colors"
              />
            </div>
          </label>

          {/* Emergency toggle */}
          <button
            type="button"
            onClick={() => setIsEmergency(v => !v)}
            className={`flex items-center justify-between w-full rounded-xl px-4 py-4 border-2 transition-colors ${
              isEmergency ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-2xl ${isEmergency ? "text-red-500" : "text-gray-400"}`}>
                emergency
              </span>
              <div className="text-left">
                <p className={`text-base font-semibold ${isEmergency ? "text-red-600" : "text-[#111418]"}`}>
                  Contacto de emergencia
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Aparecerá en el botón de ayuda rápida</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-0.5 ${isEmergency ? "bg-red-500" : "bg-gray-200"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${isEmergency ? "translate-x-6" : "translate-x-0"}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Photo section */}
      <div className="px-4 pt-8">
        <h2 className="text-2xl font-bold mb-2 text-[#111418]">Foto</h2>
        <p className="text-gray-500 mb-5 text-sm">Tomá una nueva foto o mantené la actual.</p>

        {displayPhoto && !isCameraOn && (
          <div className="relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gray-100 mb-4 aspect-video">
            <img src={displayPhoto} alt="Foto actual" className="w-full h-full object-cover" />
            {capturedImage && (
              <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Nueva foto
              </span>
            )}
          </div>
        )}

        {isCameraOn && (
          <div className="relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gray-100 mb-4 aspect-video">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        )}

        {isCameraOn ? (
          <button
            onClick={capturePhoto}
            className="w-full h-14 bg-[#137fec] hover:bg-blue-600 text-white rounded-xl text-lg font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mb-4"
          >
            <span className="material-symbols-outlined text-[24px]">camera</span>
            Tomar foto
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={startCamera}
              className="h-12 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">add_a_photo</span>
              {capturedImage ? "Retomar" : "Cámara"}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-12 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
              Subir foto
            </button>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {message && (
        <div className={`mx-4 mb-4 rounded-xl px-4 py-3 text-center text-sm font-semibold ${
          message.type === "success"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      <div className="px-4 pt-4 mt-auto">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !name.trim() || !relationship}
          className="w-full h-16 bg-[#137fec] hover:bg-blue-600 text-white rounded-xl text-xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
          ) : (
            <>
              <span className="material-symbols-outlined text-[28px]">save</span>
              Guardar cambios
            </>
          )}
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  )
}
