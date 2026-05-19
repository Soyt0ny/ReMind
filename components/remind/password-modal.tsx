"use client"

import { useEffect, useRef, useState } from "react"
import { authFetch } from "@/lib/auth"

interface PasswordModalProps {
  onConfirmed: () => void
  onCancel: () => void
}

export function PasswordModal({ onConfirmed, onCancel }: PasswordModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch("/auth/verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || "Contraseña incorrecta.")
      }
      onConfirmed()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Contraseña incorrecta.")
      setPassword("")
      inputRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-slide-up mb-2">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-[#137fec]/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#137fec] text-2xl">lock</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#111418]">Verificación requerida</h3>
            <p className="text-sm text-gray-500">Ingresá tu contraseña para continuar.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl h-14 px-4 text-base focus:border-[#137fec] focus:ring-0 outline-none transition-colors"
          />

          {error && (
            <p className="text-sm text-red-600 font-semibold text-center bg-red-50 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full h-14 bg-[#137fec] hover:bg-blue-600 text-white rounded-xl text-base font-bold transition-all disabled:opacity-40 flex items-center justify-center"
          >
            {loading
              ? <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
              : "Confirmar"
            }
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full h-12 text-gray-500 font-semibold text-base hover:text-gray-700 transition-colors"
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  )
}
