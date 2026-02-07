"use client"

import { CheckCircle2, HelpCircle, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface IdentificationResult {
  name: string
  relationship: string
  confidence: number
  age?: number
  extra?: string
}

interface IdentificationCardProps {
  result: IdentificationResult | null
  isIdentifying: boolean
}

export function IdentificationCard({ result, isIdentifying }: IdentificationCardProps) {
  // If we're currently identifying but already have a result, keep showing
  // the existing result to avoid flicker — only show the spinner when there
  // is no current result.
  if (isIdentifying && !result) {
    return (
      <Card className="animate-slide-up border border-primary/20 bg-card shadow-sm">
        <CardContent className="flex flex-col items-center gap-3 p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
          <p className="text-center text-lg font-semibold text-card-foreground">
            Identificando...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!result) {
    return (
      <Card className="border border-border/60 bg-card/80 shadow-sm">
        <CardContent className="flex flex-col items-center gap-3 px-6 py-8">
          <div className="rounded-2xl bg-muted p-3">
            <HelpCircle className="h-10 w-10 text-muted-foreground/60" aria-hidden="true" />
          </div>
          <p className="text-center text-lg font-medium text-muted-foreground">
            Apunte la camara hacia un rostro para identificar
          </p>
        </CardContent>
      </Card>
    )
  }

  if (result.name === "desconocido") {
    return (
      <Card className="animate-slide-up border border-destructive/20 bg-destructive/5 shadow-sm">
        <CardContent className="flex flex-col items-center gap-3 px-6 py-8">
          <div className="rounded-2xl bg-destructive/10 p-3">
            <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
          </div>
          <p className="text-center text-xl font-bold text-destructive">
            Persona no identificada
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Esta persona no esta registrada en el sistema
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="animate-slide-up animate-success-glow border border-accent/30 bg-gradient-to-b from-accent/5 to-accent/10 shadow-sm">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-8">
        <div className="rounded-2xl bg-accent/15 p-3">
          <CheckCircle2 className="h-12 w-12 text-accent" aria-hidden="true" />
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-card-foreground md:text-3xl">
            {"Este es "}
            <span className="text-primary">{result.name}</span>
          </p>
          <p className="mt-1.5 text-xl font-semibold text-accent md:text-2xl">
            {"Tu "}
            <span className="capitalize">{result.relationship}</span>
          </p>
          {result.age !== undefined && result.age !== null && (
            <p className="mt-1 text-sm text-muted-foreground">Edad: {result.age}</p>
          )}
          {result.extra && (
            <p className="mt-2 text-sm text-muted-foreground break-words">{result.extra}</p>
          )}
        </div>
        <div className="mt-1 rounded-full bg-muted px-3 py-1">
          <p className="text-xs font-medium text-muted-foreground">
            {"Confianza: "}
            {Math.round((1 - result.confidence) * 100)}%
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
