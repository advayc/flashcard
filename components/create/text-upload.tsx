"use client"

import { Textarea } from "@/components/ui/textarea"

export function TextUpload({
  content,
  setContent,
}: {
  content: string
  setContent: (content: string) => void
}) {
  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Paste your notes, lecture text, or any content you want to convert to flashcards..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        className="neon-input resize-none focus:border-neon-blue/50 focus:shadow-neon-sm transition-all duration-300"
      />
      <p className="text-xs text-gray-400">
        Paste text from your notes, textbooks, or study materials to generate flashcards
      </p>
    </div>
  )
}
