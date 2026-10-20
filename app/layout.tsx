import type { Metadata } from 'next'
import { Archivo, IBM_Plex_Mono } from 'next/font/google'
import { Console } from '@/components/console/Console'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { SmoothScroll } from '@/components/SmoothScroll'
import { agency } from '@/content/agency'
import { Scene } from '@/webgl/Scene'
import './globals.css'

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' })
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono', display: 'swap' })

export const metadata: Metadata = {
  title: `${agency.name} — Event production (portfolio piece)`,
  description: `${agency.name} is a fictional event production agency. A portfolio piece designed and developed by ${agency.credits.author}.`,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
      <body>
        <SmoothScroll />
        <a href="#main" className="skip-link">Skip to content</a>
        <Header />
        <Console />
        <Scene />
        <main id="main" className="relative z-10">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
