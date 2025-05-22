"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { User } from "@supabase/supabase-js"
import { PlusCircle, LogOut, User2 } from "lucide-react"
import { useSupabase } from "@/lib/supabase/provider"

export function DashboardHeader({ user }: { user: User }) {
  const { supabase } = useSupabase()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/signin"
  }

  return (
    <header className="border-b border-skyBlue/10 bg-black sticky top-0 z-50">
      <div className="container max-w-7xl flex items-center justify-between py-4">
        <div>
          <h1 className="text-xl font-bold text-white">
            <Link href="/dashboard" className="flex items-center">
              <span className="mr-2">⚡</span> Flashcard App
            </Link>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild className="bg-skyBlue hover:bg-skyBlue/90 text-white hover:shadow-sky-sm transition-all">
            <Link href="/create" className="group">
              <PlusCircle className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              Create Flashcards
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-skyBlue/20 hover:border-skyBlue/40 hover:bg-skyBlue/5 transition-all"
          >
            <Link href="/profile">
              <User2 className="h-4 w-4" />
              <span className="sr-only">Profile</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSignOut}
            className="border-skyBlue/20 hover:border-skyBlue/40 hover:bg-skyBlue/5 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
