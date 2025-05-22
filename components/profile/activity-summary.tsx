import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Zap, Award, Flame, Trophy } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface ActivitySummaryProps {
  totalContributions: number
  currentStreak: number
  longestStreak: number
  setsCount: number
  totalCardsStudied: number
  contributionsByType: Record<string, number>
}

export function ActivitySummary({
  totalContributions,
  currentStreak,
  longestStreak,
  setsCount,
  totalCardsStudied,
  contributionsByType,
}: ActivitySummaryProps) {
  // Calculate activity level (0-100)
  const activityLevel = Math.min(100, Math.round((totalContributions / 500) * 100))

  // Calculate streak progress
  const streakProgress = currentStreak > 0 ? Math.min(100, (currentStreak / 30) * 100) : 0

  // Calculate next milestone
  const nextMilestone =
    currentStreak < 7
      ? 7
      : currentStreak < 14
        ? 14
        : currentStreak < 30
          ? 30
          : currentStreak < 60
            ? 60
            : currentStreak < 90
              ? 90
              : currentStreak < 180
                ? 180
                : 365

  const daysToNextMilestone = nextMilestone - currentStreak

  return (
    <div className="space-y-4">
      <Card className="sky-card hover:shadow-sky-sm transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Activity Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Activity Level</span>
              <span className="text-sm font-medium">{activityLevel}%</span>
            </div>
            <Progress value={activityLevel} className="h-2 bg-gray-800" indicatorClassName="bg-skyBlue" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Current Streak</span>
              <span className="text-sm font-medium">{currentStreak} days</span>
            </div>
            <Progress value={streakProgress} className="h-2 bg-gray-800" indicatorClassName="bg-skyBlue" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Total Contributions</span>
              <div className="flex items-center mt-1">
                <Zap className="h-4 w-4 text-skyBlue mr-1.5" />
                <span className="text-lg font-bold">{totalContributions}</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Longest Streak</span>
              <div className="flex items-center mt-1">
                <Trophy className="h-4 w-4 text-skyBlue mr-1.5" />
                <span className="text-lg font-bold">{longestStreak} days</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Flashcard Sets</span>
              <div className="flex items-center mt-1">
                <BookOpen className="h-4 w-4 text-skyBlue mr-1.5" />
                <span className="text-lg font-bold">{setsCount}</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Cards Studied</span>
              <div className="flex items-center mt-1">
                <Award className="h-4 w-4 text-skyBlue mr-1.5" />
                <span className="text-lg font-bold">{totalCardsStudied}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-800">
            <div className="flex items-center">
              <Flame className="h-4 w-4 text-skyBlue mr-2" />
              <span className="text-sm">
                {daysToNextMilestone > 0 ? (
                  <>
                    {daysToNextMilestone} days until your next streak milestone ({nextMilestone} days)
                  </>
                ) : (
                  <>You've reached a {currentStreak}-day streak milestone!</>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
