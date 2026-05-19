"use client"

import { useEffect, useState, useCallback } from "react"
import { authFetch } from "@/lib/auth"
import { PasswordModal } from "./password-modal"

export interface Person {
  id: number
  name: string
  relationship: string
  age?: number
  extra?: string
  phone?: string
  photo?: string
  is_emergency: boolean
  created_at: string
}

interface PeopleListProps {
  onAddContact: () => void
  onEditContact?: (person: Person) => void
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase()
}

function getBadgeColor(relationship: string): string {
  const r = relationship.toLowerCase()
  if (r.includes("hij")) return "bg-blue-100 text-blue-700"
  if (r.includes("médic") || r.includes("doctor")) return "bg-green-100 text-green-700"
  if (r.includes("niet")) return "bg-pink-100 text-pink-700"
  if (r.includes("cuidador")) return "bg-sky-100 text-sky-700"
  if (r.includes("esposo") || r.includes("esposa")) return "bg-purple-100 text-purple-700"
  if (r.includes("amigo") || r.includes("amiga")) return "bg-orange-100 text-orange-700"
  return "bg-blue-100 text-blue-700"
}

export function PeopleList({ onAddContact, onEditContact }: PeopleListProps) {
  const [people, setPeople]   = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")
  const [deleting, setDeleting]           = useState<number | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const fetchPeople = useCallback(async () => {
    try {
      setLoading(true)
      const res = await authFetch("/people")
      if (res.ok) setPeople(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPeople() }, [fetchPeople])

  async function confirmDelete(id: number) {
    setDeleting(id)
    setPendingDeleteId(null)
    try {
      const res = await authFetch(`/people/${id}`, { method: "DELETE" })
      if (res.ok) setPeople(prev => prev.filter(p => p.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const filtered = people.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.relationship.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#111418]">Personas Conocidas</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Reconoce a tus seres queridos</p>
          </div>
          <button
            onClick={onAddContact}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#137fec]/10 text-[#137fec] hover:bg-[#137fec]/20 transition-colors active:scale-95"
            aria-label="Agregar persona"
          >
            <span className="material-symbols-outlined text-[28px] font-bold">add</span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-5 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
          <input
            type="text"
            placeholder="Buscar nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border border-gray-200 text-base placeholder:text-gray-400 focus:outline-none focus:border-[#137fec] transition-colors"
          />
        </div>
      </header>

      {/* List */}
      <div className="flex-1 px-4 py-2 flex flex-col gap-3">
        {loading && (
          <div className="flex justify-center pt-12">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#137fec]" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-16 gap-4">
            <span className="material-symbols-outlined text-gray-300" style={{ fontSize: 64 }}>group</span>
            <p className="text-gray-400 font-medium text-center">
              {search ? "No se encontraron resultados" : "Aún no hay personas registradas"}
            </p>
            {!search && (
              <button
                onClick={onAddContact}
                className="mt-2 flex items-center gap-2 rounded-xl bg-[#137fec] px-5 py-3 text-white font-bold"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Agregar persona
              </button>
            )}
          </div>
        )}

        {!loading && filtered.map(person => (
          <div
            key={person.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-4"
          >
            {/* Photo or initial */}
            <div className="h-14 w-14 shrink-0 rounded-full overflow-hidden bg-[#137fec]/10 flex items-center justify-center">
              {person.photo ? (
                <img src={person.photo} alt={person.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-[#137fec]">{getInitial(person.name)}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-[#111418] truncate">{person.name}</p>
              <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${getBadgeColor(person.relationship)}`}>
                {person.relationship}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {onEditContact && (
                <button
                  onClick={() => onEditContact(person)}
                  className="p-2 rounded-full hover:bg-blue-50 text-gray-300 hover:text-[#137fec] transition-colors"
                  aria-label="Editar"
                >
                  <span className="material-symbols-outlined text-xl">edit</span>
                </button>
              )}
              <button
                onClick={() => setPendingDeleteId(person.id)}
                disabled={deleting === person.id}
                className="p-2 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                aria-label="Eliminar"
              >
                {deleting === person.id ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-red-400" />
                ) : (
                  <span className="material-symbols-outlined text-xl">delete</span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {pendingDeleteId !== null && (
        <PasswordModal
          onConfirmed={() => confirmDelete(pendingDeleteId)}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  )
}
