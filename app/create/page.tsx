import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { CreateFlashcardForm } from "@/components/create/create-flashcard-form"

export default async function CreatePage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/signin")
  }

  return (
    <div className="min-h-screen bg-black">
      <DashboardHeader user={session.user} />
      <main className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold neon-text">Create New Flashcards</h1>
          <p className="text-gray-400 mt-2">Upload text or a PDF to generate AI-powered flashcards</p>
        </div>

        <CreateFlashcardForm userId={session.user.id} />
      </main>
    </div>
  )
}
