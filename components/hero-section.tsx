import Link from "next/link"
import { ButtonNeon } from "@/components/ui/button-neon"

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neon-blue/20 via-transparent to-transparent"></div>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl animate-glow neon-text">
              AI-Powered Flashcards
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
              Turn your notes, PDFs, and study materials into effective flashcards instantly with AI
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <ButtonNeon variant="glow" size="lg" asChild>
              <Link href="/signup">Get Started</Link>
            </ButtonNeon>
            <ButtonNeon variant="outline" size="lg" asChild>
              <Link href="/signin">Sign In</Link>
            </ButtonNeon>
          </div>
        </div>
      </div>

      {/* Animated floating elements */}
      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-neon-blue/5 to-neon-cyan/5 blur-3xl animate-float"
        style={{ animationDelay: "0s" }}
      ></div>
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-neon-sky/5 to-neon-blue/5 blur-3xl animate-float"
        style={{ animationDelay: "1s" }}
      ></div>
    </section>
  )
}
