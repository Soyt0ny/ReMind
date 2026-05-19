"use client"

import { useEffect, useState } from "react"
import { authFetch } from "@/lib/auth"
import type { IdentificationResult } from "./identification-card"

interface RecentIdent extends IdentificationResult {
  timestamp: number
}

interface HomeScreenProps {
  displayName: string
  recentIdentifications: RecentIdent[]
  onIdentify: () => void
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Buenos Días"
  if (h < 18) return "Buenas Tardes"
  return "Buenas Noches"
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })
}

function formatDateTime(ts: number): string {
  const d   = new Date(ts)
  const now = new Date()
  const time = d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })

  if (d.toDateString() === now.toDateString()) return `Hoy, ${time}`

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return `Ayer, ${time}`

  return d.toLocaleDateString("es", { day: "numeric", month: "short" }) + `, ${time}`
}

export function HomeScreen({ displayName, recentIdentifications, onIdentify }: HomeScreenProps) {
  const recent = recentIdentifications.slice(0, 2)
  const [emergencyPhone, setEmergencyPhone] = useState<string | null>(null)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [historyPage, setHistoryPage] = useState(0)
  const PAGE_SIZE = 5

  useEffect(() => {
    authFetch("/people")
      .then(r => r.ok ? r.json() : [])
      .then((people: Array<{ is_emergency: boolean; phone?: string }>) => {
        const contact = people.find(p => p.is_emergency && p.phone)
        if (contact?.phone) setEmergencyPhone(contact.phone)
      })
      .catch(() => {})
  }, [])

  return (
    <main className="flex-1 flex flex-col p-6 gap-6 pb-24">
      {/* Greeting */}
      <section className="mt-2">
        <h2 className="text-3xl font-bold leading-tight text-[#111418]">
          {getGreeting()},<br />
          <span className="text-[#137fec]">{displayName || "bienvenido"}</span>
        </h2>
        <p className="text-lg text-gray-500 mt-1 font-medium">¿Listo para reconocer a alguien?</p>
      </section>

      {/* Big identify button */}
      <button
        onClick={onIdentify}
        className="group relative flex flex-col items-center justify-center w-full min-h-[280px] bg-[#137fec] hover:bg-blue-600 active:scale-[0.98] transition-all duration-200 rounded-3xl shadow-xl shadow-blue-200 overflow-hidden gap-5 py-8"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
        <div className="bg-white/20 p-6 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
          <span className="material-symbols-outlined text-white" style={{ fontSize: 72 }}>face_retouching_natural</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-center px-6">
          <h3 className="text-3xl font-extrabold text-white tracking-tight">Identificar Persona</h3>
          <p className="text-blue-100 text-base font-medium">Toca aquí para escanear una cara</p>
        </div>
      </button>

      {/* Recently identified */}
      {recent.length > 0 && (
        <section className="mt-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#111418]">Identificados Recientemente</h3>
            <button
              onClick={() => { setHistoryPage(0); setShowHistory(true) }}
              className="flex items-center gap-1 text-sm font-semibold text-[#137fec] hover:text-blue-700 transition-colors"
            >
              Ver todos
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {recent.map((r) => (
              <div
                key={`${r.name}-${r.timestamp}`}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center gap-3"
              >
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-blue-50">
                  {r.photo ? (
                    <img src={r.photo} alt={r.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 36 }}>person</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-base font-bold text-[#111418] leading-tight">{r.name}</p>
                  <p className="text-sm font-medium text-[#137fec] mt-0.5">{r.relationship}</p>
                </div>
                <div className="text-xs text-gray-400 font-medium">{formatTime(r.timestamp)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Emergency button */}
      <div className="mt-2">
        <button
          onClick={() => emergencyPhone && setShowEmergencyModal(true)}
          disabled={!emergencyPhone}
          className="w-full flex items-center justify-center gap-4 py-6 rounded-2xl font-extrabold text-2xl tracking-wide shadow-lg shadow-red-500/30 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600 text-white"
        >
          <span className="material-symbols-outlined filled text-[36px]">emergency</span>
          <span>Llamada de Emergencia</span>
        </button>
        {!emergencyPhone && (
          <p className="text-center text-xs text-gray-400 mt-2">
            Configurá un contacto de emergencia en Contactos
          </p>
        )}

        {showHistory && (() => {
          const totalPages = Math.ceil(recentIdentifications.length / PAGE_SIZE)
          const pageItems  = recentIdentifications.slice(historyPage * PAGE_SIZE, (historyPage + 1) * PAGE_SIZE)
          return (
            <div
              className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setShowHistory(false)}
            >
              <div
                className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-[#111418]">Historial de Identificaciones</h3>
                  <button onClick={() => setShowHistory(false)} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                    <span className="material-symbols-outlined text-gray-500 text-2xl">close</span>
                  </button>
                </div>

                {/* List */}
                <div className="divide-y divide-gray-100">
                  {pageItems.map((r) => (
                    <div key={`${r.name}-${r.timestamp}`} className="flex items-center gap-4 px-6 py-4">
                      <div className="h-14 w-14 shrink-0 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-100">
                        {r.photo
                          ? <img src={r.photo} alt={r.name} className="h-full w-full object-cover" />
                          : <span className="material-symbols-outlined text-gray-400 text-2xl">person</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#111418] truncate">{r.name}</p>
                        <p className="text-sm text-[#137fec] font-medium">{r.relationship}</p>
                      </div>
                      <p className="text-xs text-gray-400 font-medium shrink-0 text-right">{formatDateTime(r.timestamp)}</p>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                    <button
                      onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                      disabled={historyPage === 0}
                      className="flex items-center gap-1 text-sm font-semibold text-[#137fec] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                      Anterior
                    </button>
                    <span className="text-sm text-gray-400 font-medium">
                      {historyPage + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setHistoryPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={historyPage === totalPages - 1}
                      className="flex items-center gap-1 text-sm font-semibold text-[#137fec] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                  </div>
                )}

                <div className="h-safe pb-6" />
              </div>
            </div>
          )
        })()}

        {showEmergencyModal && emergencyPhone && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
            onClick={() => setShowEmergencyModal(false)}
          >
            <div
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-red-500 px-6 py-8 flex flex-col items-center gap-3">
                <span className="material-symbols-outlined filled text-white text-[56px]">emergency</span>
                <p className="text-white font-bold text-xl">Contacto de Emergencia</p>
              </div>
              <div className="px-6 py-8 flex flex-col items-center gap-6">
                <a
                  href={`tel:${emergencyPhone}`}
                  className="text-5xl font-extrabold text-[#111418] tracking-wider text-center"
                >
                  {emergencyPhone}
                </a>
                <a
                  href={`tel:${emergencyPhone}`}
                  className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-xl shadow-lg shadow-red-500/30 transition-all active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined filled text-[28px]">call</span>
                  Llamar ahora
                </a>
                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="text-gray-400 font-semibold text-base"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export type { RecentIdent }
