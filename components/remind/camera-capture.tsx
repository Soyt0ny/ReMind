"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { IdentificationCard, type IdentificationResult } from "./identification-card"
import { authFetch } from "@/lib/auth"

const CAPTURE_INTERVAL_MS = 2000
const HOLD_MS = 5000
const CONFIDENCE_DELTA = 0.05

interface CameraCaptureProps {
  onBack: () => void
  onRegister: () => void
  onIdentified?: (result: IdentificationResult) => void
  onPersonLost?: () => void
}

export function CameraCapture({ onBack, onRegister, onIdentified, onPersonLost }: CameraCaptureProps) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resultRef   = useRef<IdentificationResult | null>(null)
  const lastShownAt = useRef<number | null>(null)

  const [isCameraOn, setIsCameraOn]     = useState(false)
  const [isIdentifying, setIsIdentifying] = useState(false)
  const [result, setResult]             = useState<IdentificationResult | null>(null)
  const [error, setError]               = useState<string | null>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setIsCameraOn(true)
    } catch {
      setError("No se pudo acceder a la cámara. Verificá los permisos.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
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

    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const base64Image = canvas.toDataURL("image/jpeg", 0.8)

    setIsIdentifying(true)
    try {
      const response = await authFetch(`/identify`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ image: base64Image }),
      })
      if (!response.ok) throw new Error("Error en la identificación")

      const data: IdentificationResult = await response.json()
      const now       = Date.now()
      const samePerson = resultRef.current?.name === data.name && resultRef.current?.relationship === data.relationship

      if (samePerson && lastShownAt.current) {
        const elapsed   = now - lastShownAt.current
        const confDelta = Math.abs((data.confidence || 0) - (resultRef.current?.confidence || 0))
        if (elapsed >= HOLD_MS || confDelta >= CONFIDENCE_DELTA) {
          setResult(data); resultRef.current = data; lastShownAt.current = now
        }
      } else {
        const prevKnown = resultRef.current && resultRef.current.name !== "desconocido"
        setResult(data); resultRef.current = data; lastShownAt.current = now
        if (data.name !== "desconocido") {
          onIdentified?.(data)
        } else if (prevKnown) {
          onPersonLost?.()
        }
      }
    } catch {
      const unknown: IdentificationResult = { name: "desconocido", relationship: "", confidence: 0 }
      const now = Date.now()
      if (!(resultRef.current?.name === "desconocido" && lastShownAt.current && now - lastShownAt.current < HOLD_MS)) {
        if (resultRef.current && resultRef.current.name !== "desconocido") onPersonLost?.()
        setResult(unknown); resultRef.current = unknown; lastShownAt.current = now
      }
    } finally {
      setIsIdentifying(false)
    }
  }, [onIdentified, onPersonLost])

  useEffect(() => {
    startCamera()
    return () => { stopCamera() }
  }, [startCamera, stopCamera])

  useEffect(() => {
    if (isCameraOn) {
      intervalRef.current = setInterval(captureAndIdentify, CAPTURE_INTERVAL_MS)
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null } }
  }, [isCameraOn, captureAndIdentify])

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-black">
      {/* Camera feed */}
      {isCameraOn && (
        <video
          ref={videoRef}
          autoPlay playsInline muted
          className="absolute inset-0 h-full w-full object-cover"
          aria-label="Vista de la cámara"
        />
      )}

      {/* Dark overlay when no camera */}
      {!isCameraOn && (
        <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-4">
          {error ? (
            <>
              <span className="material-symbols-outlined text-red-400" style={{ fontSize: 64 }}>no_photography</span>
              <p className="text-white text-center px-8">{error}</p>
              <button
                onClick={startCamera}
                className="mt-2 rounded-xl bg-[#137fec] px-6 py-3 text-white font-bold"
              >
                Reintentar
              </button>
            </>
          ) : (
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/20 border-t-white" />
          )}
        </div>
      )}

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between p-4 pt-10">
        <button
          onClick={() => { stopCamera(); onBack() }}
          className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2.5 shadow-lg backdrop-blur-md transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined text-[#111418]" style={{ fontSize: 22 }}>arrow_back</span>
          <span className="text-sm font-bold text-[#111418]">Volver</span>
        </button>

        <div className="rounded-full bg-black/40 px-4 py-2 backdrop-blur-sm flex items-center gap-2">
          {result && result.name !== "desconocido" && (
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          )}
          <p className="text-sm font-semibold text-white tracking-wide">
            {isIdentifying ? "Analizando..." : "Buscando rostros..."}
          </p>
        </div>
      </div>

      <div className="flex-1" />

      {/* Result card */}
      <div className="relative z-20 w-full p-4 pb-8">
        <IdentificationCard
          result={result}
          isIdentifying={isIdentifying}
          onRegister={() => { stopCamera(); onRegister() }}
          onRetry={() => { setResult(null); resultRef.current = null }}
        />
      </div>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  )
}
