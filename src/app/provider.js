// app/providers.js (Separate client component for providers)
'use client'

import { SessionProvider } from "next-auth/react"

export function Providers({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}