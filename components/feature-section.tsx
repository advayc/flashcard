import type React from "react"
import { Upload, Brain, Layers, RefreshCw } from "lucide-react"

export function FeatureSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-black relative">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black"></div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl neon-text">How It Works</h2>
            <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
              Generate flashcards in seconds, study smarter, and retain more information
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
            <FeatureCard
              icon={<Upload className="h-12 w-12 mb-4 text-neon-blue" />}
              title="Upload Content"
              description="Upload PDF slides or paste text from your study materials"
            />
            <FeatureCard
              icon={<Brain className="h-12 w-12 mb-4 text-neon-cyan" />}
              title="AI Generation"
              description="Our AI analyzes your content and creates optimized flashcards"
            />
            <FeatureCard
              icon={<Layers className="h-12 w-12 mb-4 text-neon-sky" />}
              title="Study Efficiently"
              description="Review your automatically generated flashcards with spaced repetition"
            />
            <FeatureCard
              icon={<RefreshCw className="h-12 w-12 mb-4 text-neon-blue" />}
              title="Track Progress"
              description="Mark cards as mastered to focus on challenging content"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 neon-card rounded-lg transition-all duration-300 hover:translate-y-[-5px]">
      <div className="mb-2">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}
