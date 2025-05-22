import { createBrowserClient as createBrowserSupabaseClient } from "@supabase/ssr"

// Fallback values for preview/development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vuoiemcijhdeknackxvl.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1b2llbWNpamhkZWtuYWNreHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2ODEzMTAsImV4cCI6MjA2MDI1NzMxMH0.wyLVf4oNOk8d79mD0Bwp2ilS-1wItDCoZzd_U1z4U9o"

export const createBrowserClient = () => createBrowserSupabaseClient(supabaseUrl, supabaseAnonKey)
