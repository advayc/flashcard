import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

export default async function Home() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is logged in, redirect to dashboard
  // Otherwise, redirect to signin page
  if (session) {
    redirect("/dashboard")
  } else {
    redirect("/signin")
  }
}
