import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { FlashcardStudy } from "@/components/study/flashcard-study"

export default async function StudyPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/signin")
  }

  const { data: flashcardSet } = await supabase
    .from("flashcard_sets")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .single()

  if (!flashcardSet) {
    redirect("/dashboard")
  }

  const { data: flashcards } = await supabase.from("flashcards").select("*").eq("set_id", params.id).order("id")

  return (
    <div className="min-h-screen bg-black">
      <main className="container max-w-4xl mx-auto pt-8 px-4 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold neon-text">{flashcardSet.title}</h1>
          <p className="text-gray-400 mt-1">{flashcards?.length || 0} cards to study</p>
        </div>

        {flashcards && flashcards.length > 0 ? (
          <FlashcardStudy flashcards={flashcards} setId={params.id} />
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p>No flashcards found in this set.</p>
          </div>
        )}
      </main>
    </div>
  )
}
