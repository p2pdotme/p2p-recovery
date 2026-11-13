'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'

interface AppLink {
  name: string
  href: string
}

// Apps whose Help section now hosts recovery
const NEW_HOMES: readonly AppLink[] = [
  { name: 'app.p2p.me', href: 'https://app.p2p.me' },
  { name: 'app.coins.me', href: 'https://app.coins.me' },
  { name: 'goat.cash', href: 'https://goat.cash' },
]

// Shown on every page load to point visitors at the apps that replaced this site
export function SiteMovedNotice() {
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-moved-title"
        className="relative w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 id="site-moved-title" className="pr-8 text-lg font-bold text-black dark:text-white">
          Recovery has moved
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          This website has moved. You can now recover your funds from the Help section of these apps:
        </p>

        <ul className="mt-4 space-y-2">
          {NEW_HOMES.map((app) => (
            <li key={app.href}>
              <a
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-white dark:hover:bg-neutral-800"
              >
                <span>
                  {app.name}
                  <span className="ml-2 font-normal text-neutral-500 dark:text-neutral-400">Help section</span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-neutral-500" />
              </a>
            </li>
          ))}
        </ul>

        <button
          onClick={() => setIsOpen(false)}
          className="mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          Continue on this site
        </button>
      </div>
    </div>
  )
}
