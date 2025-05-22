import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, BookOpen, Zap, Award, Flame, Trophy } from "lucide-react"

interface ProfileStatsProps {
  totalContributions: number
  currentStreak: number
  longestStreak: number
  setsCount: number
  totalCardsStudied: number
}

export function ProfileStats({
  totalContributions,
  currentStreak,
  longestStreak,
  setsCount,
  totalCardsStudied,
}: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="sky-card hover:shadow-sky-sm transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
          <Zap className="h-4 w-4 text-skyBlue" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalContributions}</div>
          <p className="text-xs text-gray-400 mt-1">Lifetime activity points</p>
        </CardContent>
      </Card>

      <Card className="sky-card hover:shadow-sky-sm transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <Flame className="h-4 w-4 text-skyBlue" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentStreak} days</div>
          <p className="text-xs text-gray-400 mt-1">Keep it going!</p>
        </CardContent>
      </Card>

      <Card className="sky-card hover:shadow-sky-sm transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
          <Trophy className="h-4 w-4 text-skyBlue" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{longestStreak} days</div>
          <p className="text-xs text-gray-400 mt-1">Your personal best</p>
        </CardContent>
      </Card>

      <Card className="sky-card hover:shadow-sky-sm transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Flashcard Sets</CardTitle>
          <BookOpen className="h-4 w-4 text-skyBlue" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{setsCount}</div>
          <p className="text-xs text-gray-400 mt-1">Created sets</p>
        </CardContent>
      </Card>

      <Card className="sky-card hover:shadow-sky-sm transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Cards Studied</CardTitle>
          <Award className="h-4 w-4 text-skyBlue" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCardsStudied}</div>
          <p className="text-xs text-gray-400 mt-1">Total cards reviewed</p>
        </CardContent>
      </Card>

      <Card className="sky-card hover:shadow-sky-sm transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Next Milestone</CardTitle>
          <CalendarDays className="h-4 w-4 text-skyBlue" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {currentStreak < 7 ? 7 - currentStreak : 30 - (currentStreak % 30)} days
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {currentStreak < 7
              ? "Until 7-day streak"
              : currentStreak < 30
                ? "Until 30-day streak"
                : "Until next 30-day milestone"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
