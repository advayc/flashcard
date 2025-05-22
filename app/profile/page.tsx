"use client"

import { useState, useEffect } from "react"
import { redirect, useRouter } from "next/navigation"
import { ContributionGraph } from "@/components/profile/contribution-graph"
import { ActivitySummary } from "@/components/profile/activity-summary"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Edit2 } from "lucide-react"
import { AppTracker } from "@/components/app-tracker"
import { ProfileEditForm } from "@/components/profile/profile-edit-form"
import { useSupabase } from "@/lib/supabase/provider"
import { optimizeImageUrl } from "@/lib/utils"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [contributionData, setContributionData] = useState<any>({})
  const [stats, setStats] = useState<any>({
    totalContributions: 0,
    currentStreak: 0,
    longestStreak: 0,
    setsCount: 0,
    totalCardsStudied: 0,
    contributionsByType: {},
  })
  const [loading, setLoading] = useState(true)
  const { supabase } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    async function loadProfileData() {
      try {
        // Get current user
        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
          return redirect("/signin")
        }

        setUser(userData.user)

        // Get profile data
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userData.user.id).single()

        setProfile(profileData)

        // Get contribution data
        try {
          const { data: contributionsData } = await supabase.rpc("get_user_contributions", {
            user_id_param: userData.user.id,
          })
          setContributionData(contributionsData || {})
        } catch (error) {
          console.error("Error fetching contribution data:", error)
          setContributionData({})
        }

        // Get user stats
        try {
          const { data: statsData } = await supabase.rpc("get_user_stats", {
            user_id_param: userData.user.id,
          })
          setStats(
            statsData || {
              totalContributions: 0,
              currentStreak: 0,
              longestStreak: 0,
              setsCount: 0,
              totalCardsStudied: 0,
              contributionsByType: {},
            },
          )
        } catch (error) {
          console.error("Error fetching user stats:", error)
        }
      } catch (error) {
        console.error("Error loading profile data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-skyBlue">Loading profile...</div>
      </div>
    )
  }

  if (!user) {
    redirect("/signin")
    return null
  }

  // Get user's display name or email
  const displayName = user.user_metadata?.full_name || profile?.full_name || user.email?.split("@")[0] || "User"

  // Get avatar URL
  const avatarUrl = optimizeImageUrl(user.user_metadata?.avatar_url || profile?.avatar_url || null)

  // Get initials for avatar fallback
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)

  return (
    <div className="min-h-screen bg-black">
      <AppTracker />
      <main className="container max-w-7xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            {isEditing ? (
              <ProfileEditForm
                userId={user.id}
                initialData={{
                  full_name: profile?.full_name || user.user_metadata?.full_name || "",
                  avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
                  email: user.email,
                }}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <div className="space-y-6">
                <Card className="sky-card hover:shadow-sky-sm transition-all">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="h-24 w-24 border-2 border-skyBlue/20 hover:border-skyBlue/40 transition-all">
                        <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                        <AvatarFallback className="text-xl bg-skyBlue/10 text-skyBlue">{initials}</AvatarFallback>
                      </Avatar>

                      <div className="text-center">
                        <h1 className="text-2xl font-bold mb-1">{displayName}</h1>
                        <p className="text-gray-400 mb-4">{user.email}</p>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-skyBlue/20 hover:border-skyBlue/50 transition-all"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit Profile
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <ActivitySummary
                  totalContributions={stats.totalContributions}
                  currentStreak={stats.currentStreak}
                  longestStreak={stats.longestStreak}
                  setsCount={stats.setsCount}
                  totalCardsStudied={stats.totalCardsStudied}
                  contributionsByType={stats.contributionsByType}
                />
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <ContributionGraph
              data={contributionData}
              username={displayName}
              contributionsByType={stats.contributionsByType}
            />

            <Card className="sky-card hover:shadow-sky-sm transition-all mt-8">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Contribution Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-skyBlue/20 flex items-center justify-center mt-0.5">
                        <span className="text-xs">1</span>
                      </div>
                      <span>Creating a new account counts as 1 contribution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-skyBlue/20 flex items-center justify-center mt-0.5">
                        <span className="text-xs">1</span>
                      </div>
                      <span>Creating a new flashcard set counts as 1 contribution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-skyBlue/20 flex items-center justify-center mt-0.5">
                        <span className="text-xs">1</span>
                      </div>
                      <span>Completing a study session with 30%+ correct answers counts as 1 contribution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-skyBlue/20 flex items-center justify-center mt-0.5">
                        <span className="text-xs">2</span>
                      </div>
                      <span>Getting a perfect score (100%) in a study session counts as 2 contributions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-skyBlue/20 flex items-center justify-center mt-0.5">
                        <span className="text-xs">1</span>
                      </div>
                      <span>Your first activity each day counts as an additional contribution</span>
                    </li>
                  </ul>

                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-skyBlue/20 flex items-center justify-center mt-0.5">
                        <span className="text-xs">3</span>
                      </div>
                      <span>Reaching a 7-day streak milestone counts as 3 contributions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-skyBlue/20 flex items-center justify-center mt-0.5">
                        <span className="text-xs">1</span>
                      </div>
                      <span>Sharing a flashcard set with others counts as 1 contribution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-skyBlue/20 flex items-center justify-center mt-0.5">
                        <span className="text-xs">1</span>
                      </div>
                      <span>Opening the app each day counts as 1 contribution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-skyBlue/20 flex items-center justify-center mt-0.5">
                        <span className="text-xs">1</span>
                      </div>
                      <span>Editing or improving a flashcard counts as 1 contribution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-skyBlue/20 flex items-center justify-center mt-0.5">
                        <span className="text-xs">1</span>
                      </div>
                      <span>Providing feedback or reporting issues counts as 1 contribution</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
