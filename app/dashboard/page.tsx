import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { FlashcardSets } from "@/components/dashboard/flashcard-sets"
import { EmptyState } from "@/components/dashboard/empty-state"

export default async function Dashboard() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/signin")
  }

  const { data: flashcardSets } = await supabase
    .from("flashcard_sets")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader user={session.user} />
      <main className="container max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold neon-text">Your Flashcard Sets</h1>
        </div>

        {flashcardSets && flashcardSets.length > 0 ? <FlashcardSets sets={flashcardSets} /> : <EmptyState />}
      </main>
    </div>
  )
}
