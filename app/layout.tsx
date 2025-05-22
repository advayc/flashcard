import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SupabaseProvider } from "@/lib/supabase/provider"
import { Suspense } from "react"

// Optimize font loading
const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Ensure text is visible during font loading
  preload: true,
})

// Update the metadata title and description
export const metadata = {
  title: "Flashcard App - AI-Powered Flashcards",
  description: "Generate and study flashcards from your text and PDFs with AI",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Preconnect to Supabase for faster loading */}
        <link rel="preconnect" href="https://vuoiemcijhdeknackxvl.supabase.co" />
        <link rel="dns-prefetch" href="https://vuoiemcijhdeknackxvl.supabase.co" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
          <SupabaseProvider>
            <Suspense
              fallback={<div className="min-h-screen bg-black flex items-center justify-center">Loading...</div>}
            >
              {children}
            </Suspense>
            <Toaster />
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
