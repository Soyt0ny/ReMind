import React from "react"
import type { Metadata, Viewport } from 'next'
import { Lexend } from 'next/font/google'
import './globals.css'

const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend' })

export const metadata: Metadata = {
  title: 'ReMind - Asistente Visual de Memoria',
  description: 'Aplicación de asistencia visual para personas con Alzheimer o trastornos de memoria.',
}

export const viewport: Viewport = {
  themeColor: '#137fec',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className={`${lexend.variable} font-display antialiased`}>{children}</body>
    </html>
  )
}
