"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User2, Menu, X, LogOut, BarChart2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  const pathname = usePathname()
  const { supabase } = useSupabase()
  const [user, setUser] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isHomePage = pathname === "/"

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-skyBlue/10 bg-black/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center group transition-all duration-300">
            <span className="text-xl font-bold text-skyBlue group-hover:text-white group-hover:shadow-[0_0_10px_rgba(14,165,233,0.7)] transition-all duration-300">
              ⚡ Flashcard App
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user && (
            <>
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-all duration-300 hover:text-skyBlue hover:translate-y-[-2px] ${
                  pathname === "/dashboard" ? "text-skyBlue" : "text-gray-400"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/create"
                className={`text-sm font-medium transition-all duration-300 hover:text-skyBlue hover:translate-y-[-2px] ${
                  pathname === "/create" ? "text-skyBlue" : "text-gray-400"
                }`}
              >
                Create
              </Link>
              <Link
                href="/profile"
                className={`text-sm font-medium transition-all duration-300 hover:text-skyBlue hover:translate-y-[-2px] ${
                  pathname === "/profile" ? "text-skyBlue" : "text-gray-400"
                }`}
              >
                Profile
              </Link>
            </>
          )}

          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-skyBlue/10 transition-all duration-300"
                >
                  <User2 className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-black/90 backdrop-blur-sm border border-skyBlue/20 animate-in slide-in-from-top-5 duration-200"
              >
                <DropdownMenuItem
                  asChild
                  className="hover:bg-skyBlue/10 hover:text-skyBlue focus:bg-skyBlue/10 focus:text-skyBlue transition-all duration-200"
                >
                  <Link href="/profile">
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await supabase.auth.signOut()
                  }}
                  className="hover:bg-red-500/10 hover:text-red-500 focus:bg-red-500/10 focus:text-red-500 transition-all duration-200"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            isHomePage && (
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  asChild
                  className="hover:bg-skyBlue/10 hover:text-skyBlue transition-all duration-300"
                >
                  <Link href="/signin">Sign in</Link>
                </Button>
                <Button
                  className="bg-skyBlue hover:bg-skyBlue/90 text-white hover:shadow-[0_5px_15px_rgba(14,165,233,0.5)] transition-all duration-300"
                  asChild
                >
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            )
          )}
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-4">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="hover:bg-skyBlue/10 transition-all duration-300"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-skyBlue/10 p-4 bg-black/90 backdrop-blur-md animate-in slide-in-from-top-5 duration-200">
          <nav className="flex flex-col gap-4">
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium px-2 py-1.5 rounded-md transition-all duration-300 ${
                    pathname === "/dashboard"
                      ? "bg-skyBlue/10 text-skyBlue"
                      : "text-gray-400 hover:text-skyBlue hover:bg-skyBlue/5"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/create"
                  className={`text-sm font-medium px-2 py-1.5 rounded-md transition-all duration-300 ${
                    pathname === "/create"
                      ? "bg-skyBlue/10 text-skyBlue"
                      : "text-gray-400 hover:text-skyBlue hover:bg-skyBlue/5"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Create
                </Link>
                <Link
                  href="/profile"
                  className={`text-sm font-medium px-2 py-1.5 rounded-md transition-all duration-300 ${
                    pathname === "/profile"
                      ? "bg-skyBlue/10 text-skyBlue"
                      : "text-gray-400 hover:text-skyBlue hover:bg-skyBlue/5"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
              </>
            )}

            {user ? (
              <Button
                variant="outline"
                onClick={async () => {
                  await supabase.auth.signOut()
                  setIsMenuOpen(false)
                }}
                className="border-skyBlue/20 hover:border-skyBlue/50 hover:bg-skyBlue/10 transition-all duration-300"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            ) : (
              isHomePage && (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    asChild
                    className="border-skyBlue/20 hover:border-skyBlue/50 hover:bg-skyBlue/10 transition-all duration-300"
                  >
                    <Link href="/signin" onClick={() => setIsMenuOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                  <Button
                    className="bg-skyBlue hover:bg-skyBlue/90 text-white hover:shadow-[0_5px_15px_rgba(14,165,233,0.5)] transition-all duration-300"
                    asChild
                  >
                    <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                      Sign up
                    </Link>
                  </Button>
                </div>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
