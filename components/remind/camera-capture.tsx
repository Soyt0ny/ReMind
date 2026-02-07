"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Camera, CameraOff, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { IdentificationCard } from "./identification-card"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const CAPTURE_INTERVAL_MS = 2000
// When the same person is repeatedly detected, keep the UI for this many ms
// before allowing another update. This prevents the card from 'refreshing'
// every capture when it's the same person.
const HOLD_MS = 5000
// Minimum confidence change required to force an update (0..1)
const CONFIDENCE_DELTA = 0.05

interface IdentificationResult {
  name: string
  relationship: string
  confidence: number
  age?: number
  extra?: string
}

export function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Ref with the last shown result to compare incoming identifications
  const resultRef = useRef<IdentificationResult | null>(null)
  const lastShownAt = useRef<number | null>(null)

  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isIdentifying, setIsIdentifying] = useState(false)
  const [result, setResult] = useState<IdentificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsCameraOn(true)
    } catch {
      setError("No se pudo acceder a la camara. Verifique los permisos.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop()
      }
      streamRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsCameraOn(false)
    setResult(null)
    resultRef.current = null
  }, [])

  const captureAndIdentify = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const base64Image = canvas.toDataURL("image/jpeg", 0.8)

    setIsIdentifying(true)
    try {
      const response = await fetch(`${API_BASE_URL}/identify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      })

      if (!response.ok) {
        throw new Error("Error en la identificacion")
      }

      const data = await response.json()

      const now = Date.now()
      const samePerson =
        resultRef.current &&
        data.name === resultRef.current.name &&
        data.relationship === resultRef.current.relationship

      // If same person and we showed it recently, only update if confidence
      // changed significantly.
      if (samePerson && lastShownAt.current) {
        const elapsed = now - lastShownAt.current
        const confDelta = Math.abs((data.confidence || 0) - (resultRef.current?.confidence || 0))
        if (elapsed < HOLD_MS && confDelta < CONFIDENCE_DELTA) {
          // skip update
        } else {
          setResult(data)
          resultRef.current = data
          lastShownAt.current = now
        }
      } else {
        // New person (or first time) — update and record time
        setResult(data)
        resultRef.current = data
        lastShownAt.current = now
      }
    } catch {
      const unknown = {
        name: "desconocido",
        relationship: "",
        confidence: 0,
      }
      const now = Date.now()
      const sameUnknown = resultRef.current && resultRef.current.name === unknown.name
      if (sameUnknown && lastShownAt.current && now - lastShownAt.current < HOLD_MS) {
        // keep showing current unknown without resetting timestamp
      } else {
        setResult(unknown)
        resultRef.current = unknown
        lastShownAt.current = now
      }
    } finally {
      setIsIdentifying(false)
    }
  }, [])

  useEffect(() => {
    if (isCameraOn) {
      intervalRef.current = setInterval(captureAndIdentify, CAPTURE_INTERVAL_MS)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isCameraOn, captureAndIdentify])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <div className="flex flex-col gap-5">
      {/* Camera viewport */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`aspect-video w-full object-cover ${!isCameraOn ? "hidden" : ""}`}
          aria-label="Vista de la camara"
        />
        {isCameraOn && (
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-primary/30 animate-pulse-glow" />
        )}
        {!isCameraOn && (
          <div className="flex aspect-video flex-col items-center justify-center gap-4 bg-gradient-to-b from-muted/30 to-muted/60">
            <div className="rounded-2xl bg-muted p-4">
              <CameraOff className="h-12 w-12 text-muted-foreground/60" aria-hidden="true" />
            </div>
            <p className="text-center text-lg font-medium text-muted-foreground">
              La camara esta apagada
            </p>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      </div>

      {/* Toggle button */}
      <Button
        onClick={isCameraOn ? stopCamera : startCamera}
        size="lg"
        className={`h-14 gap-3 rounded-xl text-lg font-bold shadow-sm transition-all duration-200 ${
          isCameraOn
            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md"
            : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md"
        }`}
        aria-label={isCameraOn ? "Apagar camara" : "Encender camara"}
      >
        {isCameraOn ? (
          <>
            <CameraOff className="h-6 w-6" aria-hidden="true" />
            Apagar Camara
          </>
        ) : (
          <>
            <Video className="h-6 w-6" aria-hidden="true" />
            Encender Camara
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="animate-slide-up rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
        >
          <p className="text-center text-base font-semibold text-destructive">{error}</p>
        </div>
      )}

      {/* Result card */}
      <IdentificationCard result={result} isIdentifying={isIdentifying} />
    </div>
  )
}
