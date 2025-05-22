"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDate as formatDateUtil } from "@/lib/utils"

interface ContributionGraphProps {
  data: Record<string, { count: number; details: any[] }>
  username: string
  contributionsByType: Record<string, number>
}

export function ContributionGraph({ data, username, contributionsByType }: ContributionGraphProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Calculate total contributions
  const totalContributions = useMemo(() => {
    return Object.values(data).reduce((sum, day) => sum + day.count, 0)
  }, [data])

  // Generate calendar data for the graph
  const calendarData = useMemo(() => {
    const now = new Date()
    const endDate = new Date(now)
    const startDate = new Date(now)
    startDate.setFullYear(startDate.getFullYear() - 1)
    startDate.setDate(startDate.getDate() + 1) // Start from the day after today, one year ago

    // Adjust to start from the beginning of the week (Sunday)
    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek)

    // Generate weeks
    const weeks = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const week = []
      for (let i = 0; i < 7; i++) {
        const dateStr = currentDate.toISOString().split("T")[0]
        const isInRange = currentDate >= startDate && currentDate <= endDate

        week.push({
          date: new Date(currentDate),
          dateStr,
          count: isInRange && data[dateStr] ? data[dateStr].count : 0,
          details: isInRange && data[dateStr] ? data[dateStr].details : [],
          isInRange,
        })

        currentDate.setDate(currentDate.getDate() + 1)
      }
      weeks.push(week)
    }

    return weeks
  }, [data])

  // Get color for contribution count - GitHub-style with our color scheme
  const getColor = (count: number, isInRange = true) => {
    if (!isInRange) return "bg-gray-800/30"
    if (count === 0) return "bg-gray-800"
    if (count < 3) return "bg-skyBlue/20"
    if (count < 6) return "bg-skyBlue/40"
    if (count < 9) return "bg-skyBlue/70"
    return "bg-skyBlue"
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return formatDateUtil(date)
  }

  // Get contribution type icon
  const getContributionTypeIcon = (type: string) => {
    switch (type) {
      case "account_created":
        return "👤"
      case "set_created":
        return "📚"
      case "study_completed":
        return "📝"
      case "perfect_score":
        return "🏆"
      case "streak_milestone":
        return "🔥"
      case "first_of_day":
        return "🌅"
      case "shared_set":
        return "🔗"
      case "app_opened":
        return "🚪"
      case "flashcard_edited":
        return "✏️"
      case "profile_updated":
        return "👤"
      case "feedback_provided":
        return "💬"
      case "invite_sent":
        return "📨"
      case "achievement_unlocked":
        return "🎖️"
      default:
        return "✨"
    }
  }

  // Format contribution type for display
  const formatContributionType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Get month labels for the graph
  const monthLabels = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const now = new Date()
    const startDate = new Date(now)
    startDate.setFullYear(startDate.getFullYear() - 1)
    startDate.setDate(startDate.getDate() + 1)

    const result = []
    const currentDate = new Date(startDate)

    // Add first month
    result.push({
      name: months[currentDate.getMonth()],
      position: 0,
    })

    // Move to next month and add all months until we reach current month
    let currentMonth = currentDate.getMonth()
    while (currentDate <= now) {
      currentDate.setDate(currentDate.getDate() + 1)
      if (currentDate.getMonth() !== currentMonth) {
        currentMonth = currentDate.getMonth()
        // Calculate position based on days passed since start
        const daysPassed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const position = daysPassed / 7 // Convert to weeks

        result.push({
          name: months[currentMonth],
          position: position,
        })
      }
    }

    return result
  }, [])

  return (
    <Card className="sky-card w-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-medium">Contribution Activity</CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                <Info className="h-4 w-4 text-gray-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-black border-skyBlue/20">
              <div className="space-y-2">
                <h4 className="font-medium">About Contributions</h4>
                <p className="text-sm text-gray-400">
                  Contributions are activities that help you build your learning streak. The darker the color, the more
                  contributions on that day.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">past year</span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col space-y-6">
          <div className={`transition-opacity duration-300 ${isAnimating ? "opacity-0" : "opacity-100"}`}>
            <div className="contribution-graph-container">
              {/* Month labels */}
              <div className="month-labels-container mb-1">
                <div className="w-10"></div>
                <div className="month-labels">
                  {monthLabels.map((month, i) => (
                    <div
                      key={i}
                      className="month-label"
                      style={{
                        left: `${month.position * 16}px`, // 16px = cell width + gap
                      }}
                    >
                      {month.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contribution graph */}
              <div className="graph-container">
                <div className="day-labels">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                <div className="cells-container">
                  {calendarData.map((week, weekIndex) => (
                    <div key={weekIndex} className="week-column">
                      {week.map((day, dayIndex) => (
                        <TooltipProvider key={dayIndex}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`contribution-cell ${getColor(day.count, day.isInRange)}`}
                                aria-label={`${day.count} contributions on ${formatDate(day.date)}`}
                                onClick={() => setSelectedDate(day.dateStr)}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-black border-skyBlue/20">
                              <div className="text-xs">
                                <div className="font-medium">
                                  {day.count === 1 ? "1 contribution" : `${day.count} contributions`}
                                </div>
                                <div className="text-gray-400">{formatDate(day.date)}</div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="legend-container">
                <div className="mr-2">Less</div>
                <div className="legend-cells">
                  <div className="legend-cell bg-gray-800"></div>
                  <div className="legend-cell bg-skyBlue/20"></div>
                  <div className="legend-cell bg-skyBlue/40"></div>
                  <div className="legend-cell bg-skyBlue/70"></div>
                  <div className="legend-cell bg-skyBlue"></div>
                </div>
                <div className="ml-2">More</div>
              </div>

              <div className="text-sm text-gray-400 mt-2">{totalContributions} total submissions</div>
            </div>
          </div>

          {/* Selected date details */}
          {selectedDate && data[selectedDate] && (
            <Card className="mt-4 bg-black/40 border-skyBlue/10 animate-in slide-in-from-top-5 duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm font-medium">{data[selectedDate].count} contributions</div>
                  <div className="space-y-1">
                    {data[selectedDate].details.map((detail, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="text-lg">{getContributionTypeIcon(detail.type)}</span>
                        <span>{formatContributionType(detail.type)}</span>
                        <span className="text-skyBlue">+{detail.value}</span>
                        <span className="ml-auto">{detail.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contribution breakdown */}
          <Card className="mt-4 bg-black/40 border-skyBlue/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Contribution Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(contributionsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2 text-sm">
                    <span className="text-lg">{getContributionTypeIcon(type)}</span>
                    <span className="text-gray-300">{formatContributionType(type)}</span>
                    <span className="ml-auto text-skyBlue font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
