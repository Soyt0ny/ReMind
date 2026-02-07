"use client"

import { useState } from "react"
import { Header } from "@/components/remind/header"
import { Navigation } from "@/components/remind/navigation"
import { CameraCapture } from "@/components/remind/camera-capture"
import { RegisterForm } from "@/components/remind/register-form"

type View = "identify" | "register"

export default function Page() {
  const [activeView, setActiveView] = useState<View>("identify")

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6">
        <div className="lg:hidden">
          <Navigation activeView={activeView} onChangeView={setActiveView} />
        </div>

        {/*
          Responsive content:
          - On small screens show a single panel based on `activeView`.
          - On md+ screens show both panels side-by-side (camera left, register right).
        */}
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div
            className={`animate-slide-up ${activeView === "identify" ? "" : "hidden"} lg:block lg:col-span-2`}
          >
            <CameraCapture />
          </div>

          <div
            className={`animate-slide-up ${activeView === "register" ? "" : "hidden"} lg:block lg:col-span-1`}
          >
            <RegisterForm onRegistered={() => setActiveView("identify")} />
          </div>
        </div>

        <footer className="mt-8 pb-4 text-center">
          <p className="text-xs text-muted-foreground/60">
            ReMind &middot; Asistente Visual de Memoria
          </p>
        </footer>
      </main>
    </div>
  )
}
