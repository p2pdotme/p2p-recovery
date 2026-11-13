'use client'

import { ArrowUpRight } from 'lucide-react'

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

// Shown to every visitor on every page load, with no way to dismiss it:
// this site is retired in favour of the apps listed above
export function SiteMovedNotice() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-moved-title"
        className="relative w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2 id="site-moved-title" className="text-lg font-bold text-black dark:text-white">
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
      </div>
    </div>
  )
}
