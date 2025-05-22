import Link from "next/link"
import { Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full py-6 border-t border-neon-blue/10 bg-black/80 backdrop-blur-sm">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
          <Link href="/" className="flex items-center">
            <span className="font-bold neon-text">⚡ Flashcard App</span>
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Flashcard App. All rights reserved.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-neon-blue transition-colors"
          >
            <Github className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
