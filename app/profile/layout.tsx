import type { ReactNode } from "react"
import { Navbar } from "@/components/navbar"

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
