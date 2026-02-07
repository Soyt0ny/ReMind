"use client"

import { useRef, useState, useCallback } from "react"
import { Camera, Save, RotateCcw, UserPlus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface RegisterFormProps {
  onRegistered?: () => void
}

export function RegisterForm({ onRegistered }: RegisterFormProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [name, setName] = useState("")
  const [relationship, setRelationship] = useState("")
  const [age, setAge] = useState<string>("")
  const [extra, setExtra] = useState<string>("")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsCameraOn(true)
      setCapturedImage(null)
    } catch {
      setMessage({ type: "error", text: "No se pudo acceder a la camara." })
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop()
      }
      streamRef.current = null
    }
    setIsCameraOn(false)
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const base64 = canvas.toDataURL("image/jpeg", 0.9)
    setCapturedImage(base64)
    stopCamera()
  }, [stopCamera])

  const resetCapture = useCallback(() => {
    setCapturedImage(null)
    setMessage(null)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!capturedImage || !name.trim() || !relationship.trim()) {
      setMessage({ type: "error", text: "Complete todos los campos y tome una foto." })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          relationship: relationship.trim(),
          image: capturedImage,
          age: age ? Number(age) : null,
          extra: extra ? extra.trim() : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || "Error al registrar")
      }

      setMessage({ type: "success", text: `${name} ha sido registrado exitosamente.` })
      setName("")
      setRelationship("")
      setAge("")
      setExtra("")
      setCapturedImage(null)
      onRegistered?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al registrar la persona."
      setMessage({ type: "error", text: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }, [capturedImage, name, relationship, age, extra, onRegistered])

  const handleDeleteAll = useCallback(async () => {
    const ok = window.confirm("¿Seguro que desea eliminar todos los registros? Esta acción no se puede deshacer.")
    if (!ok) return

    setIsSubmitting(true)
    setMessage(null)
    try {
      const res = await fetch(`${API_BASE_URL}/people?confirm=true`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || "Error al eliminar los registros")
      }
      const data = await res.json().catch(() => null)
      setMessage({ type: "success", text: data?.message || "Todos los registros fueron eliminados." })
      onRegistered?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar los registros."
      setMessage({ type: "error", text: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }, [onRegistered])

  return (
    <Card className="border border-border/60 bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-xl font-bold text-card-foreground md:text-2xl">
          <div className="rounded-xl bg-primary/10 p-2">
            <UserPlus className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          Registrar Nueva Persona
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name" className="text-base font-semibold text-card-foreground">
            Nombre
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Ej: Maria Garcia"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-xl border-border/60 bg-muted/30 text-base transition-all duration-200 focus:bg-background focus:shadow-sm"
            aria-required="true"
          />
        </div>

        {/* Relationship */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="relationship" className="text-base font-semibold text-card-foreground">
            Parentesco
          </Label>
          <Input
            id="relationship"
            type="text"
            placeholder="Ej: Hija, Esposo, Doctor"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="h-12 rounded-xl border-border/60 bg-muted/30 text-base transition-all duration-200 focus:bg-background focus:shadow-sm"
            aria-required="true"
          />
        </div>

        {/* Age */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="age" className="text-base font-semibold text-card-foreground">
            Edad (opcional)
          </Label>
          <Input
            id="age"
            type="number"
            min={0}
            placeholder="Ej: 72"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="h-12 rounded-xl border-border/60 bg-muted/30 text-base transition-all duration-200 focus:bg-background focus:shadow-sm"
            aria-required="false"
          />
        </div>

        {/* Extra info */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="extra" className="text-base font-semibold text-card-foreground">
            Información extra (opcional)
          </Label>
          <textarea
            id="extra"
            placeholder="Notas, detalles adicionales..."
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            className="h-24 w-full resize-none rounded-xl border border-border/60 bg-muted/30 p-3 text-base transition-all duration-200 focus:bg-background focus:shadow-sm"
          />
        </div>

        {/* Camera / Photo area */}
        <div className="flex flex-col gap-2.5">
          <Label className="text-base font-semibold text-card-foreground">Foto</Label>
          <div className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/20">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`aspect-video w-full object-cover ${!isCameraOn || capturedImage ? "hidden" : ""}`}
              aria-label="Vista previa de la camara"
            />
            {capturedImage && (
              <img
                src={capturedImage || "/placeholder.svg"}
                alt="Foto capturada"
                className="aspect-video w-full object-cover"
              />
            )}
            {!isCameraOn && !capturedImage && (
              <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-gradient-to-b from-muted/20 to-muted/50">
                <div className="rounded-2xl bg-muted p-3">
                  <Camera className="h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
                </div>
                <p className="text-base text-muted-foreground">Sin foto</p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {!isCameraOn && !capturedImage && (
              <Button
                onClick={startCamera}
                size="lg"
                className="h-12 flex-1 gap-2 rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md"
              >
                <Camera className="h-5 w-5" aria-hidden="true" />
                Abrir Camara
              </Button>
            )}
            {isCameraOn && !capturedImage && (
              <Button
                onClick={capturePhoto}
                size="lg"
                className="h-12 flex-1 gap-2 rounded-xl bg-accent text-base font-bold text-accent-foreground shadow-sm transition-all duration-200 hover:bg-accent/90 hover:shadow-md"
              >
                <Camera className="h-5 w-5" aria-hidden="true" />
                Tomar Foto
              </Button>
            )}
            {capturedImage && (
              <Button
                onClick={resetCapture}
                size="lg"
                variant="outline"
                className="h-12 flex-1 gap-2 rounded-xl bg-transparent text-base font-bold transition-all duration-200 hover:bg-muted"
              >
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
                Tomar Otra Foto
              </Button>
            )}
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !capturedImage || !name.trim() || !relationship.trim()}
          size="lg"
          className="h-14 gap-3 rounded-xl bg-accent text-lg font-bold text-accent-foreground shadow-sm transition-all duration-200 hover:bg-accent/90 hover:shadow-md disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-[2.5px] border-accent-foreground/30 border-t-accent-foreground" />
              Registrando...
            </>
          ) : (
            <>
              <Save className="h-6 w-6" aria-hidden="true" />
              Guardar Persona
            </>
          )}
        </Button>

        {/* Feedback message */}
        {message && (
          <div
            role="alert"
            className={`animate-slide-up rounded-xl border px-4 py-3 text-center text-base font-semibold ${
              message.type === "success"
                ? "border-accent/30 bg-accent/5 text-accent"
                : "border-destructive/30 bg-destructive/5 text-destructive"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Separator */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-xs font-medium text-muted-foreground/60">Zona de peligro</span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        {/* Delete all button */}
        <Button
          onClick={handleDeleteAll}
          disabled={isSubmitting}
          size="lg"
          variant="outline"
          className="h-11 gap-2 rounded-xl border-destructive/30 text-sm font-semibold text-destructive transition-all duration-200 hover:bg-destructive/10 hover:border-destructive/50 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Eliminar todos los registros
        </Button>
      </CardContent>
    </Card>
  )
}
