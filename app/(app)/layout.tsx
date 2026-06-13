import React from "react"
import { MainNav } from '@/components/nav/main-nav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1">{children}</main>
    </div>
  )
}
