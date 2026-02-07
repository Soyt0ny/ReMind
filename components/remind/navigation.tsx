"use client"

import { Camera, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"

type View = "identify" | "register"

interface NavigationProps {
  activeView: View
  onChangeView: (view: View) => void
}

export function Navigation({ activeView, onChangeView }: NavigationProps) {
  return (
    <nav
      className="flex gap-2 rounded-2xl bg-secondary/60 p-1.5 shadow-sm backdrop-blur-sm"
      role="navigation"
      aria-label="Navegacion principal"
    >
      <Button
        onClick={() => onChangeView("identify")}
        size="lg"
        className={`h-14 flex-1 gap-2.5 rounded-xl text-base font-bold transition-all duration-200 md:text-lg ${
          activeView === "identify"
            ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
            : "bg-transparent text-muted-foreground shadow-none hover:bg-secondary hover:text-foreground"
        }`}
        aria-current={activeView === "identify" ? "page" : undefined}
      >
        <Camera className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
        Identificar
      </Button>
      <Button
        onClick={() => onChangeView("register")}
        size="lg"
        className={`h-14 flex-1 gap-2.5 rounded-xl text-base font-bold transition-all duration-200 md:text-lg ${
          activeView === "register"
            ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
            : "bg-transparent text-muted-foreground shadow-none hover:bg-secondary hover:text-foreground"
        }`}
        aria-current={activeView === "register" ? "page" : undefined}
      >
        <UserPlus className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
        Registrar
      </Button>
    </nav>
  )
}
