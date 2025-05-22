import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, error_description)
    return NextResponse.redirect(
      `${requestUrl.origin}/signin?error=${encodeURIComponent(error_description || "Authentication failed")}`,
    )
  }

  if (code) {
    try {
      const supabase = createServerClient()
      await supabase.auth.exchangeCodeForSession(code)
    } catch (err) {
      console.error("Error exchanging code for session:", err)
      return NextResponse.redirect(
        `${requestUrl.origin}/signin?error=${encodeURIComponent("Failed to complete authentication")}`,
      )
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin + "/dashboard")
}
