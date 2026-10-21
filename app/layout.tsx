import type { Metadata } from 'next'
import { Archivo, IBM_Plex_Mono } from 'next/font/google'
import { Console } from '@/components/console/Console'
import { ConsoleCssVars } from '@/components/ConsoleCssVars'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Preloader } from '@/components/Preloader'
import { SmoothScroll } from '@/components/SmoothScroll'
import { agency } from '@/content/agency'
import { PRELOADED_KEY } from '@/lib/preloaderKey'
import { Scene } from '@/webgl/Scene'
import './globals.css'

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' })
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono', display: 'swap' })

const title = `${agency.name} — Event production (portfolio piece)`
const description = `${agency.name} is a fictional event production agency. A portfolio piece designed and developed by ${agency.credits.author}.`

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title,
  description,
  openGraph: { title, description, type: 'website' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${archivo.variable} ${plexMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem(${JSON.stringify(PRELOADED_KEY)})==='1')document.documentElement.setAttribute('data-preloaded','')}catch(e){}`,
          }}
        />
        <noscript>
          <style>{'.preloader{display:none}'}</style>
        </noscript>
      </head>
      <body>
        <SmoothScroll />
        <ConsoleCssVars />
        <a href="#main" className="skip-link">Skip to content</a>
        <Header />
        <Console />
        <Scene />
        <main id="main" className="relative z-10">{children}</main>
        <Footer />
        <Preloader />
        <div id="shutter" aria-hidden="true" className="shutter" />
      </body>
    </html>
  )
}
