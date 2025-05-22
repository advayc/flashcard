import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export type ContributionType =
  | "account_created"
  | "set_created"
  | "study_completed"
  | "perfect_score"
  | "streak_milestone"
  | "first_of_day"
  | "shared_set"
  | "app_opened"
  | "flashcard_edited"
  | "profile_updated"
  | "feedback_provided"
  | "invite_sent"
  | "achievement_unlocked"

export async function trackContribution(userId: string, type: ContributionType, value = 1, metadata: any = {}) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase.from("user_contributions").insert([
      {
        user_id: userId,
        contribution_type: type,
        contribution_value: value,
        metadata,
      },
    ])

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error tracking contribution:", error)
    return { success: false, error }
  }
}

export async function getContributionData(userId: string, startDate?: Date, endDate?: Date) {
  const supabase = createServerClient()

  // Default to last 365 days if no date range provided
  const end = endDate || new Date()
  const start = startDate || new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000)

  try {
    // Query the user_contributions table directly
    const { data, error } = await supabase
      .from("user_contributions")
      .select("created_at, contribution_value, contribution_type, metadata")
      .eq("user_id", userId)
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: false })

    if (error) throw error

    // Format data for contribution graph by aggregating by day
    const contributionData: Record<string, { count: number; details: any[] }> = {}

    // Initialize all dates in range with 0
    const dateIterator = new Date(start)
    while (dateIterator <= end) {
      const dateStr = dateIterator.toISOString().split("T")[0]
      contributionData[dateStr] = { count: 0, details: [] }
      dateIterator.setDate(dateIterator.getDate() + 1)
    }

    // Aggregate contributions by day
    data.forEach((item) => {
      const dateStr = new Date(item.created_at).toISOString().split("T")[0]
      contributionData[dateStr].count = (contributionData[dateStr]?.count || 0) + item.contribution_value
      contributionData[dateStr].details.push({
        type: item.contribution_type,
        value: item.contribution_value,
        time: new Date(item.created_at).toLocaleTimeString(),
        metadata: item.metadata,
      })
    })

    return contributionData
  } catch (error) {
    console.error("Error fetching contribution data:", error)
    return {}
  }
}

export async function getUserStats(userId: string) {
  const supabase = createServerClient()

  try {
    // Get total contributions
    const { data: totalData, error: totalError } = await supabase
      .from("user_contributions")
      .select("contribution_value")
      .eq("user_id", userId)

    if (totalError) throw totalError

    const totalContributions = totalData.reduce((sum, item) => sum + item.contribution_value, 0)

    // Get streak data by aggregating contributions by day
    const { data: contributionsData, error: contributionsError } = await supabase
      .from("user_contributions")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (contributionsError) throw contributionsError

    // Aggregate contributions by day to calculate streaks
    const contributionDays = new Set<string>()
    contributionsData.forEach((item) => {
      const dateStr = new Date(item.created_at).toISOString().split("T")[0]
      contributionDays.add(dateStr)
    })

    // Convert to array and sort in descending order
    const sortedDays = Array.from(contributionDays).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    // Calculate current streak
    let currentStreak = 0
    if (sortedDays.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      // Check if there's a contribution today or yesterday to start the streak
      const hasRecentContribution = sortedDays.some((dateStr) => {
        const date = new Date(dateStr)
        return date.toDateString() === today.toDateString() || date.toDateString() === yesterday.toDateString()
      })

      if (hasRecentContribution) {
        currentStreak = 1

        // Count consecutive days
        const checkDate = new Date(sortedDays[0])
        checkDate.setDate(checkDate.getDate() - 1)

        for (let i = 1; i < sortedDays.length; i++) {
          const date = new Date(sortedDays[i])
          const expectedDate = new Date(checkDate)
          expectedDate.setDate(expectedDate.getDate() - 1)

          if (date.toDateString() === expectedDate.toDateString()) {
            currentStreak++
            checkDate.setDate(checkDate.getDate() - 1)
          } else {
            break
          }
        }
      }
    }

    // Get longest streak
    let longestStreak = 0
    let currentCount = 1

    for (let i = 1; i < sortedDays.length; i++) {
      const prevDate = new Date(sortedDays[i - 1])
      const currDate = new Date(sortedDays[i])

      const diffTime = Math.abs(prevDate.getTime() - currDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        currentCount++
      } else {
        longestStreak = Math.max(longestStreak, currentCount)
        currentCount = 1
      }
    }

    longestStreak = Math.max(longestStreak, currentCount)

    // Get flashcard sets count
    const { count: setsCount, error: setsError } = await supabase
      .from("flashcard_sets")
      .select("*", { count: true, head: true })
      .eq("user_id", userId)

    if (setsError) throw setsError

    // Get total cards studied
    const { data: studyData, error: studyError } = await supabase
      .from("user_contributions")
      .select("metadata")
      .eq("user_id", userId)
      .eq("contribution_type", "study_completed")

    if (studyError) throw studyError

    const totalCardsStudied = studyData.reduce((sum, item) => {
      return sum + (item.metadata?.cards_studied || 0)
    }, 0)

    // Get contribution counts by type
    const { data: typeData, error: typeError } = await supabase
      .from("user_contributions")
      .select("contribution_type, contribution_value")
      .eq("user_id", userId)

    if (typeError) throw typeError

    const contributionsByType: Record<string, number> = {}
    typeData.forEach((item) => {
      contributionsByType[item.contribution_type] =
        (contributionsByType[item.contribution_type] || 0) + item.contribution_value
    })

    return {
      totalContributions,
      currentStreak,
      longestStreak,
      setsCount: setsCount || 0,
      totalCardsStudied,
      contributionsByType,
    }
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return {
      totalContributions: 0,
      currentStreak: 0,
      longestStreak: 0,
      setsCount: 0,
      totalCardsStudied: 0,
      contributionsByType: {},
    }
  }
}

// Server action to track app opens
export async function trackAppOpen(userId: string) {
  "use server"

  const cookieStore = cookies()
  const lastOpenDate = cookieStore.get("last_app_open")
  const today = new Date().toISOString().split("T")[0]

  // Only track once per day
  if (!lastOpenDate || lastOpenDate.value !== today) {
    await trackContribution(userId, "app_opened", 1, { date: today })

    // Set cookie to prevent multiple counts per day
    cookieStore.set("last_app_open", today, {
      path: "/",
      maxAge: 86400, // 1 day
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    })

    return { success: true, newContribution: true }
  }

  return { success: true, newContribution: false }
}
