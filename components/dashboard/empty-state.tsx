import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-lightBlue/10 p-6 mb-6">
        <FileIcon className="h-10 w-10 text-lightBlue" />
      </div>
      <h2 className="text-xl font-semibold mb-2 text-white">No flashcard sets yet</h2>
      <p className="text-gray-400 mb-6 max-w-md">Create your first set to start learning with AI-powered flashcards.</p>
      <Button asChild className="bg-lightBlue hover:bg-lightBlue/90 text-white">
        <Link href="/create" className="group">
          <PlusCircle className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
          Create New Set
        </Link>
      </Button>
    </div>
  )
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  )
}
