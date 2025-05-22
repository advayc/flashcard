import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CtaSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-black relative">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neon-blue/20 via-transparent to-transparent"></div>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-8 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl animate-glow neon-text">
            Ready to Transform Your Learning?
          </h2>
          <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
            Join thousands of students who are studying smarter, not harder, with our AI-powered flashcard app
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button
              size="lg"
              className="bg-skyBlue hover:bg-skyBlue/90 text-white hover:shadow-[0_5px_15px_rgba(14,165,233,0.5)] transition-all duration-300"
              asChild
            >
              <Link href="/signup">Get Started for Free</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-skyBlue/30 hover:border-skyBlue hover:bg-skyBlue/10 text-skyBlue transition-all duration-300"
              asChild
            >
              <Link href="#pricing">View Pricing</Link>
            </Button>
          </div>

          <p className="text-sm text-gray-400">No credit card required. Start with our free plan today.</p>
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
