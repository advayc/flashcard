"use client"

import { useEffect, useRef } from "react"
import { useSupabase } from "@/lib/supabase/provider"
import { useToast } from "@/hooks/use-toast"

export function AppTracker() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    // Only track once per session
    if (hasTrackedRef.current) return

    const trackUserActivity = async () => {
      try {
        const { data } = await supabase.auth.getUser()

        if (data.user) {
          // Call the optimized database function
          const { data: result, error } = await supabase.rpc("track_app_open", {
            user_id_param: data.user.id,
          })

          if (error) throw error

          if (result) {
            // Only show toast if this is a new contribution
            toast({
              title: "Daily Check-in",
              description: "You earned a contribution for opening the app today!",
              duration: 3000,
            })
          }

          hasTrackedRef.current = true
        }
      } catch (error) {
        console.error("Error tracking app open:", error)
      }
    }

    trackUserActivity()
  }, [supabase, toast])

  return null // This component doesn't render anything
}
