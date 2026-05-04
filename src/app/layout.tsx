import type { Metadata } from 'next'
import { Sora, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'RadarS — Tu radar comercial',
  description: '¿A quién debo atender hoy y por qué?',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sora.variable} ${ibmPlexMono.variable} h-full`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
