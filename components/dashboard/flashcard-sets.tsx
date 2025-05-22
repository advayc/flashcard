"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/provider"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash2, Clock, FileText } from "lucide-react"

type FlashcardSet = {
  id: string
  title: string
  description: string | null
  card_count: number
  created_at: string
  user_id: string
}

export function FlashcardSets({ sets }: { sets: FlashcardSet[] }) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setIsDeleting(id)

    try {
      // Delete all flashcards in the set
      await supabase.from("flashcards").delete().eq("set_id", id)

      // Delete the set itself
      const { error } = await supabase.from("flashcard_sets").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Set deleted",
        description: "The flashcard set has been deleted successfully.",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error deleting set",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sets.map((set) => (
        <Card
          key={set.id}
          className="sky-card overflow-hidden transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_8px_25px_rgba(14,165,233,0.3)]"
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold mb-2 line-clamp-1 text-white">{set.title}</h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full p-1 text-gray-400 hover:text-skyBlue hover:bg-skyBlue/20 transition-all duration-300">
                    <MoreHorizontal className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-black/90 border border-skyBlue/20 animate-in slide-in-from-top-5 duration-200"
                >
                  <DropdownMenuItem
                    className="text-red-500 focus:text-red-500 cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 transition-all duration-200"
                    onClick={() => handleDelete(set.id)}
                    disabled={isDeleting === set.id}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting === set.id ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="text-sm text-gray-400 mb-4 line-clamp-2">{set.description || "No description"}</p>

            <div className="flex items-center text-sm text-gray-400 mb-2">
              <FileText className="mr-2 h-4 w-4 text-skyBlue" />
              {set.card_count || 0} cards
            </div>

            <div className="flex items-center text-sm text-gray-400">
              <Clock className="mr-2 h-4 w-4 text-skyBlue" />
              Created on {formatDate(set.created_at)}
            </div>
          </CardContent>

          <CardFooter className="bg-black/40 p-4 flex gap-2 border-t border-skyBlue/10">
            <Button
              className="w-full bg-skyBlue hover:bg-skyBlue/90 text-white transition-all duration-300 hover:shadow-[0_5px_15px_rgba(14,165,233,0.5)]"
              asChild
            >
              <Link href={`/study/${set.id}`}>Study</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
