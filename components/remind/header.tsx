"use client"

import { Brain, Heart } from "lucide-react"

export function Header() {
  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-primary/80 px-6 py-6 shadow-lg">
      <div className="relative z-10 flex flex-col items-center gap-1">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/15 p-2 backdrop-blur-sm">
            <Brain className="h-9 w-9 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary-foreground md:text-4xl">
            ReMind
          </h1>
        </div>
        <p className="flex items-center gap-1.5 text-sm font-medium text-primary-foreground/80 md:text-base">
          <Heart className="h-3.5 w-3.5" aria-hidden="true" />
          Asistente Visual de Memoria
        </p>
      </div>
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -left-4 -bottom-6 h-24 w-24 rounded-full bg-white/5" />
    </header>
  )
}
