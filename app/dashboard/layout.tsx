import type { ReactNode } from "react"
import { AppTracker } from "@/components/app-tracker"
import { Suspense } from "react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppTracker />
      <Suspense
        fallback={<div className="min-h-screen bg-black flex items-center justify-center">Loading dashboard...</div>}
      >
        {children}
      </Suspense>
    </>
  )
}
