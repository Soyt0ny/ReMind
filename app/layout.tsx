import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'

const _inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'ReMind - Asistente Visual de Memoria',
  description:
    'Aplicación de asistencia visual para personas con Alzheimer o trastornos de memoria. Identifica rostros y recuerda nombres y parentescos.',
}

export const viewport: Viewport = {
  themeColor: '#4A90D9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-MX">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
