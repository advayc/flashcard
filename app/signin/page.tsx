import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { SignInForm } from "@/components/auth/signin-form"

export default async function SignIn() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-skyBlue/5 blur-3xl animate-float"
        style={{ animationDelay: "0s" }}
      ></div>
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-discord/5 blur-3xl animate-float"
        style={{ animationDelay: "1s" }}
      ></div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Flashcard App</h1>
          <p className="text-gray-400">Sign in to access your flashcards</p>
        </div>
        <SignInForm />
      </div>
    </div>
  )
}
