'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PrivateKeyRecovery } from '@/components/private-key-recovery'

export default function PrivateKeyPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <nav className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-0.3">
              <Image
                src="/logo.png"
                alt="P2P.ME Logo"
                width={48}
                height={48}
                className="h-10 md:h-12 w-auto"
                priority
              />
              <h1
                className="text-xl md:text-2xl font-extrabold tracking-tight text-black dark:text-white"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                P2P.ME
              </h1>
            </Link>
            <a
              href="https://t.me/P2Pdotme"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
              </svg>
              <span className="hidden sm:inline">Help & Support</span>
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Recovery
        </Link>

        <div className="mb-8 sm:mb-10">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-neutral-900 dark:text-neutral-50">
              Recover with Private Key
            </h1>
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-warning/10 text-warning-dark dark:text-warning-light text-xs font-medium rounded-full border border-warning/30">
              Advanced
            </span>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl">
            Paste the private key that controls a P2P.ME Smart Account, fund it with a small amount of gas,
            and withdraw your tokens — no wallet connection required.
          </p>
        </div>

        <PrivateKeyRecovery />
      </main>

      <footer className="bg-neutral-900 dark:bg-black border-t border-neutral-800 dark:border-neutral-900 mt-8 md:mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-5">
          <div className="text-center">
            <p className="text-white font-semibold text-sm md:text-base">P2P Recovery</p>
            <p className="text-neutral-400 text-xs md:text-sm mt-1">
              Built by{' '}
              <a
                href="https://github.com/chimmykk/p2p-recovery"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300 transition-colors underline font-medium"
              >
                P2P.me Community
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
