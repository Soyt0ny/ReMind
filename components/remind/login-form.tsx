"use client"

import { useState } from "react"
import { Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { saveSession } from "@/lib/auth"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://remind.soyt0ny.site"

interface LoginFormProps {
  onAuth: (displayName: string) => void
}

type Mode = "login" | "register"

export function LoginForm({ onAuth }: LoginFormProps) {
  const [mode, setMode]         = useState<Mode>("login")
  const [email, setEmail]       = useState("")
  const [name, setName]         = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password.trim()) {
      setError("Completa el correo y la contrasena.")
      return
    }
    if (mode === "register" && !name.trim()) {
      setError("Completa tu nombre.")
      return
    }

    setLoading(true)
    try {
      const body =
        mode === "login"
          ? JSON.stringify({ email: email.trim(), password })
          : JSON.stringify({ email: email.trim(), display_name: name.trim(), password })

      const res = await fetch(`${API_BASE}/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || "Error al conectar con el servidor.")
      }

      const data = await res.json()
      saveSession(data.access_token, data.display_name, data.user_id)
      onAuth(data.display_name)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="rounded-2xl bg-primary/10 p-4">
          <Brain className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">ReMind</h1>
        <p className="text-base text-muted-foreground">Asistente Visual de Memoria</p>
      </div>

      <Card className="w-full max-w-sm border border-border/60 shadow-sm">
        <CardContent className="pt-6">
          {/* Toggle */}
          <div className="mb-6 flex rounded-xl border border-border/60 bg-muted/30 p-1">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null) }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                  mode === m
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "Ingresar" : "Crear cuenta"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {mode === "register" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name" className="text-base font-semibold">Tu nombre</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ej. Maria Garcia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl text-base"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-base font-semibold">Correo electronico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl text-base"
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-base font-semibold">Contrasena</Label>
              <Input
                id="password"
                type="password"
                placeholder={mode === "register" ? "Minimo 6 caracteres" : "Tu contrasena"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl text-base"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-destructive/5 px-4 py-2 text-center text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="h-13 mt-1 rounded-xl text-base font-bold"
            >
              {loading ? "Cargando..." : mode === "login" ? "Ingresar" : "Crear cuenta"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Cada cuenta tiene sus propios contactos registrados.
      </p>
    </div>
  )
}
