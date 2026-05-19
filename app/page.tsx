"use client"

import { useEffect, useRef, useState } from "react"
import { Header } from "@/components/remind/header"
import { Navigation } from "@/components/remind/navigation"
import { CameraCapture } from "@/components/remind/camera-capture"
import { RegisterForm } from "@/components/remind/register-form"
import { EditPersonForm } from "@/components/remind/edit-person-form"
import { HomeScreen, type RecentIdent } from "@/components/remind/home-screen"
import { PeopleList, type Person } from "@/components/remind/people-list"
import { LoginForm } from "@/components/remind/login-form"
import { PasswordModal } from "@/components/remind/password-modal"
import type { IdentificationResult } from "@/components/remind/identification-card"
import { getToken, getDisplayName, clearSession } from "@/lib/auth"

type View = "home" | "identify" | "contacts" | "register" | "edit" | "settings"
type AuthState = "loading" | "authenticated" | "unauthenticated"

export default function Page() {
  const [authState, setAuthState]   = useState<AuthState>("loading")
  const [user_id, setUserId]         = useState<number | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [view, setView]             = useState<View>("home")
  const [recentIdentifications, setRecentIdentifications] = useState<RecentIdent[]>([])
  
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const lastIdentifiedRef = useRef<string | null>(null)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  function requirePassword(action: () => void) {
    setPendingAction(() => action)
  }

  useEffect(() => {
    const token = getToken()
    const storedUserId = localStorage.getItem("remind_user_id")
    if (token && storedUserId) {
      const uid = parseInt(storedUserId)
      setUserId(uid)
      setDisplayName(getDisplayName() ?? "")
      setAuthState("authenticated")
      
      // Cargar historial específico del usuario
      try {
        const historyKey = `remind_history_${uid}`
        const stored = localStorage.getItem(historyKey)
        if (stored) {
          const parsed: RecentIdent[] = JSON.parse(stored)
          const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
          setRecentIdentifications(parsed.filter(r => r.timestamp > cutoff))
        } else {
          setRecentIdentifications([])
        }
      } catch { setRecentIdentifications([]) }

    } else {
      setAuthState("unauthenticated")
    }
  }, [])

  useEffect(() => {
    if (user_id) {
      localStorage.setItem(`remind_history_${user_id}`, JSON.stringify(recentIdentifications))
    }
  }, [recentIdentifications, user_id])

  function handleLogout() {
    clearSession()
    setAuthState("unauthenticated")
    setDisplayName("")
    setView("home")
  }

  function handleIdentified(result: IdentificationResult) {
    const key = `${result.name}|${result.relationship}`
    if (lastIdentifiedRef.current === key) return
    lastIdentifiedRef.current = key
    setRecentIdentifications(prev =>
      [{ ...result, timestamp: Date.now() }, ...prev].slice(0, 50)
    )
  }

  function handlePersonLost() {
    lastIdentifiedRef.current = null
  }

  if (authState === "loading") return null

  if (authState === "unauthenticated") {
    return (
      <LoginForm
        onAuth={(name) => {
          setDisplayName(name)
          setAuthState("authenticated")
        }}
      />
    )
  }

  if (view === "identify") {
    return (
      <div className="relative flex min-h-[100dvh] max-w-md mx-auto flex-col overflow-hidden">
        <CameraCapture
          onBack={() => setView("home")}
          onRegister={() => setView("register")}
          onIdentified={handleIdentified}
          onPersonLost={handlePersonLost}
        />
      </div>
    )
  }

  if (view === "register") {
    return (
      <div className="relative flex min-h-[100dvh] max-w-md mx-auto flex-col bg-[#f6f7f8] overflow-x-hidden">
        <Header onBack={() => setView("contacts")} />
        <RegisterForm
          onRegistered={() => setView("contacts")}
          onBack={() => setView("contacts")}
        />
      </div>
    )
  }

  if (view === "edit" && editingPerson) {
    return (
      <div className="relative flex min-h-[100dvh] max-w-md mx-auto flex-col bg-[#f6f7f8] overflow-x-hidden">
        <Header onBack={() => setView("contacts")} />
        <EditPersonForm
          person={editingPerson}
          onSaved={() => setView("contacts")}
        />
      </div>
    )
  }

  const activeTab = (
    view === "contacts" ? "contacts" : "home"
  ) as "home" | "contacts"

  return (
    <div className="relative flex min-h-[100dvh] max-w-md mx-auto flex-col bg-[#f6f7f8] overflow-x-hidden">
      <Header
        title={view === "home" ? "ReMind" : view === "contacts" ? "Contactos" : "ReMind"}
        onSettings={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-y-auto">
        {view === "home" && (
          <HomeScreen
            displayName={displayName}
            recentIdentifications={recentIdentifications}
            onIdentify={() => setView("identify")}
          />
        )}

        {view === "contacts" && (
          <PeopleList
            onAddContact={() => requirePassword(() => setView("register"))}
            onEditContact={(person) => requirePassword(() => { setEditingPerson(person); setView("edit") })}
          />
        )}

        {view === "settings" && (
          <div className="flex-1 flex flex-col px-6 pt-8 gap-6">
            <p className="text-sm font-medium text-gray-500">
              Sesión iniciada como{" "}
              <span className="font-bold text-[#111418]">{displayName}</span>
            </p>
            <button
              onClick={handleLogout}
              className="w-full h-14 flex items-center justify-center gap-3 rounded-xl bg-red-50 text-red-600 font-bold text-base border border-red-100 hover:bg-red-100 transition-colors active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      <Navigation
        active={activeTab}
        onChange={(tab) => setView(tab as View)}
      />

      {pendingAction && (
        <PasswordModal
          onConfirmed={() => { pendingAction(); setPendingAction(null) }}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  )
}
