"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  X,
  Loader2,
  Brain,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  ArrowRight,
} from "lucide-react"
import { useSupabase } from "@/lib/supabase/provider"
import { useToast } from "@/hooks/use-toast"
import { callGeminiAPI } from "@/lib/gemini"

type Flashcard = {
  id: string
  question: string
  answer: string
  set_id: string
}

const animationStyles = `
.card-flip {
  perspective: 1000px;
}

.card-flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.4s;
  transform-style: preserve-3d;
}

.card-flip.flipped .card-flip-inner {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}
`

export function FlashcardStudy({
  flashcards,
  setId,
}: {
  flashcards: Flashcard[]
  setId: string
}) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [remainingCards, setRemainingCards] = useState<Flashcard[]>([])
  const [correctCards, setCorrectCards] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [useAIGrading, setUseAIGrading] = useState(false)
  const [userAnswer, setUserAnswer] = useState("")
  const [isGrading, setIsGrading] = useState(false)
  const [gradingResult, setGradingResult] = useState<{
    isCorrect: boolean
    feedback: string
    score: number
    level: "perfect" | "good" | "partial" | "incorrect"
    specificFeedback?: string[]
  } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  // First, let's add a new state to track cumulative scores
  const [cumulativeScores, setCumulativeScores] = useState<number[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [totalScore, setTotalScore] = useState<{
    total: number
    count: number
    average: number
  }>({
    total: 0,
    count: 0,
    average: 0,
  })
  // Add a new state to track if detailed feedback is shown
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false)

  // Initialize study session when flashcards change
  useEffect(() => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setRemainingCards([...flashcards])
    setCorrectCards([])
    setProgress(0)
    setSessionStarted(true)
    setUserAnswer("")
    setGradingResult(null)
  }, [flashcards])

  // Calculate progress percentage
  useEffect(() => {
    const completedCount = flashcards.length - remainingCards.length
    setProgress((completedCount / flashcards.length) * 100)
  }, [remainingCards.length, flashcards.length])

  // Memoize the current card to avoid unnecessary re-renders
  const currentCard = useMemo(() => remainingCards[currentIndex], [remainingCards, currentIndex])

  // Use useCallback for event handlers to avoid unnecessary re-renders
  const flipCard = useCallback(() => {
    if (isFlipping) return

    setIsFlipping(true)
    setIsFlipped((prev) => !prev)

    // Reset user answer and grading result when flipping back to question
    if (isFlipped) {
      setUserAnswer("")
      setGradingResult(null)
    }

    setTimeout(() => setIsFlipping(false), 400) // Match the transition duration
  }, [isFlipping, isFlipped])

  const handleFinish = useCallback(async () => {
    // Calculate score
    const score = (correctCards.length / flashcards.length) * 100
    const scorePercentage = Math.round(score)

    // If we have AI scores, show the summary before redirecting
    if (cumulativeScores.length > 0) {
      setShowSummary(true)
      return
    }

    try {
      // Get user ID
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) {
        throw new Error("User not authenticated")
      }

      // Track contribution based on score
      const contributionData = {
        cards_studied: flashcards.length,
        correct_cards: correctCards.length,
        score_percentage: scorePercentage,
        set_id: setId,
      }

      // Track study completion contribution
      await supabase.from("user_contributions").insert([
        {
          user_id: userData.user.id,
          contribution_type: "study_completed",
          contribution_value: 1,
          metadata: contributionData,
        },
      ])

      // If score is perfect (100%), add perfect score contribution
      if (scorePercentage === 100) {
        await supabase.from("user_contributions").insert([
          {
            user_id: userData.user.id,
            contribution_type: "perfect_score",
            contribution_value: 2,
            metadata: { set_id: setId },
          },
        ])

        toast({
          title: "Perfect Score!",
          description: "You earned 2 extra contributions for your perfect score!",
        })
      }

      // Check if this is first contribution of the day
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: todayContributions } = await supabase
        .from("user_contributions")
        .select("created_at")
        .eq("user_id", userData.user.id)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: true })
        .limit(1)

      // If this is the first contribution of the day, add bonus
      if (!todayContributions || todayContributions.length === 0) {
        await supabase.from("user_contributions").insert([
          {
            user_id: userData.user.id,
            contribution_type: "first_of_day",
            contribution_value: 1,
            metadata: { date: today.toISOString() },
          },
        ])

        toast({
          title: "First Activity Today!",
          description: "You earned an extra contribution for your first activity today!",
        })
      }

      toast({
        title: "Study Session Complete",
        description: `You got ${scorePercentage}% correct!`,
      })
    } catch (error) {
      console.error("Error tracking contributions:", error)
    }

    router.push("/dashboard")
  }, [correctCards.length, flashcards.length, setId, supabase, toast, router, cumulativeScores.length])

  const handleNext = useCallback(() => {
    setShowDetailedFeedback(false)
    if (isFlipped) {
      flipCard()
      setTimeout(() => {
        if (currentIndex < remainingCards.length - 1) {
          setCurrentIndex((prev) => prev + 1)
        } else {
          // End of deck
          if (remainingCards.length === 1) {
            // Last card in the study session
            handleFinish()
          } else {
            // Loop back to the beginning
            setCurrentIndex(0)
          }
        }
      }, 400)
    } else {
      if (currentIndex < remainingCards.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else {
        // End of deck
        if (remainingCards.length === 1) {
          // Last card in the study session
          handleFinish()
        } else {
          // Loop back to the beginning
          setCurrentIndex(0)
        }
      }
    }
  }, [currentIndex, remainingCards.length, isFlipped, flipCard, handleFinish])

  const handlePrevious = useCallback(() => {
    setShowDetailedFeedback(false)
    if (isFlipped) {
      flipCard()
      setTimeout(() => {
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1)
        } else {
          // Wrap around to the end
          setCurrentIndex(remainingCards.length - 1)
        }
      }, 400)
    } else {
      if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1)
      } else {
        // Wrap around to the end
        setCurrentIndex(remainingCards.length - 1)
      }
    }
  }, [currentIndex, remainingCards.length, isFlipped, flipCard])

  const handleCorrect = useCallback(() => {
    if (!currentCard) return

    // Add to correct cards
    setCorrectCards((prev) => [...prev, currentCard.id])

    // Remove from remaining cards
    setRemainingCards((prev) => {
      const newRemainingCards = prev.filter((_, index) => index !== currentIndex)

      // Adjust current index if needed
      if (currentIndex >= newRemainingCards.length) {
        if (newRemainingCards.length === 0) {
          // All cards completed
          setTimeout(() => handleFinish(), 0)
        } else {
          setCurrentIndex(0)
        }
      }

      return newRemainingCards
    })

    setIsFlipped(false)
    setUserAnswer("")
    setGradingResult(null)

    // Show success toast
    toast({
      title: "Correct!",
      description: "Card marked as learned",
      variant: "default",
    })
  }, [currentCard, currentIndex, toast, handleFinish])

  const handleIncorrect = useCallback(() => {
    // Show feedback toast
    toast({
      title: "Keep practicing",
      description: "You'll get it next time",
      variant: "default",
    })

    handleNext()
  }, [handleNext, toast])

  const handleReset = useCallback(() => {
    setRemainingCards([...flashcards])
    setCorrectCards([])
    setCurrentIndex(0)
    setIsFlipped(false)
    setUserAnswer("")
    setGradingResult(null)
    setShowDetailedFeedback(false)
  }, [flashcards])

  // Helper function to safely parse JSON with escape characters
  const safeJsonParse = useCallback((jsonString: string) => {
    try {
      // First try direct parsing
      return JSON.parse(jsonString)
    } catch (error) {
      try {
        // If that fails, try to find and extract just the JSON object
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      } catch (nestedError) {
        // If both methods fail, create a fallback result
        console.error("Error parsing JSON:", nestedError)
      }

      // Create a fallback result
      return createFallbackResult(jsonString)
    }
  }, [])

  // Helper function to create a fallback result when JSON parsing fails
  const createFallbackResult = useCallback((responseText: string) => {
    // Extract a score if possible
    const scoreMatch = responseText.match(/score:?\s*(\d+)/i)
    const score = scoreMatch ? Number.parseInt(scoreMatch[1], 10) : 50

    // Determine level based on score
    let level: "perfect" | "good" | "partial" | "incorrect" = "partial"
    if (score >= 90) level = "perfect"
    else if (score >= 70) level = "good"
    else if (score >= 40) level = "partial"
    else level = "incorrect"

    // Create a fallback result
    return {
      score,
      isCorrect: score >= 70,
      level,
      feedback: "Your answer has been evaluated. Here's some feedback:",
      specificFeedback: [
        "+ Your answer contains some correct elements",
        "- Make sure to include all key points from the correct answer",
        "> Review the correct answer to see what you might have missed",
      ],
    }
  }, [])

  // Update the handleGradeAnswer function to track scores and handle JSON parsing errors
  const handleGradeAnswer = useCallback(async () => {
    if (!currentCard || !userAnswer.trim()) {
      toast({
        title: "Please enter your answer",
        description: "Type your answer before grading",
        variant: "destructive",
      })
      return
    }

    setIsGrading(true)

    try {
      const prompt = `
You are an AI tutor grading a student's answer to a flashcard question.

Question: ${currentCard.question}
Correct answer: ${currentCard.answer}
Student's answer: ${userAnswer}

Grade the student's answer on a scale from 0 to 100, where:
- 0-30: Incorrect (missing key concepts or contains significant errors)
- 31-60: Partially correct (contains some correct elements but has notable gaps)
- 61-90: Good (mostly correct with minor errors or omissions)
- 91-100: Perfect (exact match or semantically equivalent with all key points)

Be lenient in your grading - if the answer captures the main concept, even with different wording, consider it correct.
Focus on conceptual understanding rather than exact wording.

For ALL answers, provide specific color-coded feedback:
- Prefix correct parts with "+" (these will be highlighted in green)
- Prefix incorrect parts with "-" (these will be highlighted in red)
- Prefix helpful tips with ">" (these will be highlighted in blue)

Make sure to include at least one item of each type of feedback when relevant.

Provide your assessment in the following JSON format only, with no additional text:
{
  "score": [number between 0-100],
  "isCorrect": [boolean, true if score >= 70],
  "level": ["perfect" if 91-100, "good" if 61-90, "partial" if 31-60, "incorrect" if 0-30],
  "feedback": [brief, encouraging feedback about the overall answer],
  "specificFeedback": [array of strings with specific points about what was correct and what needs improvement, using the prefix system described above]
}
`

      const response = await callGeminiAPI(prompt)

      // Extract JSON from response
      const responseText = response.candidates[0].content.parts[0].text

      // Use the safe JSON parsing function
      const result = safeJsonParse(responseText)

      setGradingResult(result)

      // Add score to cumulative scores
      setCumulativeScores((prev) => [...prev, result.score])

      // Update the total score
      setTotalScore((prev) => {
        const newTotal = prev.total + result.score
        const newCount = prev.count + 1
        return {
          total: newTotal,
          count: newCount,
          average: Math.round(newTotal / newCount),
        }
      })

      // Show toast based on grading level with color-coded icons
      if (result.level === "perfect") {
        toast({
          title: "Perfect Answer! 🎉",
          description: result.feedback,
          variant: "default",
          className: "bg-green-900 border-green-500",
        })
      } else if (result.level === "good") {
        toast({
          title: "Good Answer! 👍",
          description: result.feedback,
          className: "bg-blue-900 border-blue-500",
        })
      } else if (result.level === "partial") {
        toast({
          title: "Partially Correct",
          description: result.feedback,
          className: "bg-yellow-900 border-yellow-500",
        })
      } else {
        toast({
          title: "Keep Practicing",
          description: result.feedback,
          className: "bg-red-900 border-red-500",
        })
      }
    } catch (error) {
      console.error("Error grading answer:", error)
      toast({
        title: "Error grading answer",
        description: "Please try again or continue manually",
        variant: "destructive",
      })
      setGradingResult(null)
    } finally {
      setIsGrading(false)
    }
  }, [currentCard, userAnswer, toast, safeJsonParse])

  // Modify the handleFinish function to show summary

  // Add a function to finalize after showing summary
  const finalizeSession = useCallback(async () => {
    setShowSummary(false)

    // Now proceed with the original finish logic
    try {
      // Get user ID
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) {
        throw new Error("User not authenticated")
      }

      // Calculate AI score if available
      let aiScorePercentage = 0
      if (cumulativeScores.length > 0) {
        aiScorePercentage = Math.round(
          cumulativeScores.reduce((sum, score) => sum + score, 0) / cumulativeScores.length,
        )
      }

      // Calculate manual score
      const manualScorePercentage = Math.round((correctCards.length / flashcards.length) * 100)

      // Use AI score if available, otherwise use manual score
      const finalScorePercentage = cumulativeScores.length > 0 ? aiScorePercentage : manualScorePercentage

      // Track contribution based on score
      const contributionData = {
        cards_studied: flashcards.length,
        correct_cards: correctCards.length,
        ai_score_percentage: aiScorePercentage,
        manual_score_percentage: manualScorePercentage,
        final_score_percentage: finalScorePercentage,
        set_id: setId,
      }

      // Track study completion contribution
      await supabase.from("user_contributions").insert([
        {
          user_id: userData.user.id,
          contribution_type: "study_completed",
          contribution_value: 1,
          metadata: contributionData,
        },
      ])

      // If score is perfect (100%), add perfect score contribution
      if (finalScorePercentage === 100) {
        await supabase.from("user_contributions").insert([
          {
            user_id: userData.user.id,
            contribution_type: "perfect_score",
            contribution_value: 2,
            metadata: { set_id: setId },
          },
        ])

        toast({
          title: "Perfect Score!",
          description: "You earned 2 extra contributions for your perfect score!",
        })
      }

      // Check if this is first contribution of the day
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: todayContributions } = await supabase
        .from("user_contributions")
        .select("created_at")
        .eq("user_id", userData.user.id)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: true })
        .limit(1)

      // If this is the first contribution of the day, add bonus
      if (!todayContributions || todayContributions.length === 0) {
        await supabase.from("user_contributions").insert([
          {
            user_id: userData.user.id,
            contribution_type: "first_of_day",
            contribution_value: 1,
            metadata: { date: today.toISOString() },
          },
        ])

        toast({
          title: "First Activity Today!",
          description: "You earned an extra contribution for your first activity today!",
        })
      }

      toast({
        title: "Study Session Complete",
        description: `You got ${finalScorePercentage}% correct!`,
      })
    } catch (error) {
      console.error("Error tracking contributions:", error)
    }

    router.push("/dashboard")
  }, [correctCards.length, flashcards.length, setId, supabase, toast, router, cumulativeScores])

  // Now let's modify the return statement to fix the UI bug and add the summary screen
  // First, add the summary screen component
  if (showSummary) {
    // Calculate average score
    const averageScore =
      cumulativeScores.length > 0
        ? Math.round(cumulativeScores.reduce((sum, score) => sum + score, 0) / cumulativeScores.length)
        : 0

    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4 text-skyBlue">Study Session Complete!</h2>

        <div className="max-w-md mx-auto bg-black/40 border border-skyBlue/20 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center mb-6">
            {averageScore >= 90 ? (
              <CheckCircle className="h-16 w-16 text-green-500 mb-2" />
            ) : averageScore >= 70 ? (
              <ThumbsUp className="h-16 w-16 text-blue-500 mb-2" />
            ) : averageScore >= 40 ? (
              <AlertCircle className="h-16 w-16 text-yellow-500 mb-2" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mb-2" />
            )}
          </div>

          <h3 className="text-xl font-bold mb-4">Your AI-Graded Score</h3>

          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Average Score:</span>
            <span
              className={`font-bold ${
                averageScore >= 90
                  ? "text-green-500"
                  : averageScore >= 70
                    ? "text-blue-500"
                    : averageScore >= 40
                      ? "text-yellow-500"
                      : "text-red-500"
              }`}
            >
              {averageScore}%
            </span>
          </div>

          <div className="h-4 bg-gray-800 rounded-full mb-6">
            <div
              className={`h-full rounded-full ${
                averageScore >= 90
                  ? "bg-green-500"
                  : averageScore >= 70
                    ? "bg-blue-500"
                    : averageScore >= 40
                      ? "bg-yellow-500"
                      : "bg-red-500"
              }`}
              style={{ width: `${averageScore}%` }}
            ></div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Cards Studied:</span>
              <span className="text-white">{cumulativeScores.length}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Perfect Answers:</span>
              <span className="text-green-500">{cumulativeScores.filter((score) => score >= 90).length}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Good Answers:</span>
              <span className="text-blue-500">
                {cumulativeScores.filter((score) => score >= 70 && score < 90).length}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Partial Answers:</span>
              <span className="text-yellow-500">
                {cumulativeScores.filter((score) => score >= 40 && score < 70).length}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Incorrect Answers:</span>
              <span className="text-red-500">{cumulativeScores.filter((score) => score < 40).length}</span>
            </div>
          </div>

          {/* Add individual scores display */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Individual Card Scores:</h4>
            <div className="max-h-40 overflow-y-auto pr-2">
              {cumulativeScores.map((score, index) => (
                <div key={index} className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">Card {index + 1}:</span>
                  <span
                    className={`text-xs font-medium ${
                      score >= 90
                        ? "text-green-400"
                        : score >= 70
                          ? "text-blue-400"
                          : score >= 40
                            ? "text-yellow-400"
                            : "text-red-400"
                    }`}
                  >
                    {score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={finalizeSession}
            className="bg-skyBlue hover:bg-skyBlue/90 text-white hover:shadow-[0_5px_15px_rgba(14,165,233,0.5)]"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Now let's fix the "no current card" case
  if (!currentCard) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4 text-skyBlue">All Done!</h2>
        <p className="text-gray-400 mb-8">You've completed all flashcards in this set.</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={handleReset} variant="outline" className="group hover:border-skyBlue/50 hover:bg-skyBlue/10">
            <RotateCcw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            Study Again
          </Button>
          <Button
            onClick={handleFinish}
            className="bg-skyBlue hover:bg-skyBlue/90 text-white hover:shadow-[0_5px_15px_rgba(14,165,233,0.5)]"
          >
            Finish Session
          </Button>
        </div>
      </div>
    )
  }

  // Now let's fix the main UI with the card and buttons
  return (
    <>
      <div className="flex flex-col items-center">
        <div className="w-full mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>
              Card {currentIndex + 1} of {remainingCards.length}
            </span>
            <span>
              {correctCards.length} correct out of {flashcards.length} total
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-gray-800" indicatorClassName="bg-skyBlue" />
        </div>

        {/* AI Grading Option */}
        <div className="w-full max-w-2xl mx-auto mb-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Checkbox
              id="useAIGrading"
              checked={useAIGrading}
              onCheckedChange={(checked) => {
                setUseAIGrading(checked === true)
                if (!checked) {
                  setUserAnswer("")
                  setGradingResult(null)
                }
              }}
              className="data-[state=checked]:bg-skyBlue data-[state=checked]:border-skyBlue"
            />
            <Label htmlFor="useAIGrading" className="text-sm text-gray-300 cursor-pointer flex items-center">
              <Brain className="h-4 w-4 mr-1.5 text-skyBlue" />
              Use AI to grade my answers
            </Label>
          </div>

          {totalScore.count > 0 && (
            <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-md border border-skyBlue/20">
              <span className="text-sm text-gray-300">Total Score:</span>
              <span
                className={`text-sm font-bold ${
                  totalScore.average >= 90
                    ? "text-green-400"
                    : totalScore.average >= 70
                      ? "text-blue-400"
                      : totalScore.average >= 40
                        ? "text-yellow-400"
                        : "text-red-400"
                }`}
              >
                {totalScore.average}% ({totalScore.count} cards)
              </span>
            </div>
          )}
        </div>

        {/* Enhanced card with better flip transition */}
        <div className="w-full max-w-2xl mx-auto mb-6">
          <div
            ref={cardRef}
            className={`card-flip ${isFlipped ? "flipped" : ""}`}
            onClick={!useAIGrading || isFlipped ? flipCard : undefined}
          >
            <div className="card-flip-inner">
              <Card className="w-full p-8 cursor-pointer min-h-[300px] flex flex-col justify-center transition-all duration-300 sky-card card-front hover:shadow-[0_10px_30px_rgba(14,165,233,0.3)]">
                <div className="text-sm uppercase font-semibold text-skyBlue mb-2">Question</div>
                <div className="text-xl font-medium whitespace-pre-line text-white">{currentCard.question}</div>

                {useAIGrading && !isFlipped && (
                  <div className="mt-6 w-full" onClick={(e) => e.stopPropagation()}>
                    <Label htmlFor="userAnswer" className="text-sm text-gray-300 mb-2 block">
                      Your Answer:
                    </Label>
                    <Textarea
                      id="userAnswer"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full bg-black/50 border-skyBlue/20 focus:border-skyBlue/50 resize-none min-h-[100px]"
                    />

                    {/* Compact feedback with toggle */}
                    {gradingResult && (
                      <div
                        className={`mt-4 p-3 rounded-md border ${
                          gradingResult.level === "perfect"
                            ? "bg-green-900/20 border-green-500"
                            : gradingResult.level === "good"
                              ? "bg-blue-900/20 border-blue-500"
                              : gradingResult.level === "partial"
                                ? "bg-yellow-900/20 border-yellow-500"
                                : "bg-red-900/20 border-red-500"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-sm font-medium flex items-center ${
                              gradingResult.level === "perfect"
                                ? "text-green-400"
                                : gradingResult.level === "good"
                                  ? "text-blue-400"
                                  : gradingResult.level === "partial"
                                    ? "text-yellow-400"
                                    : "text-red-400"
                            }`}
                          >
                            {gradingResult.level === "perfect" ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1.5" />
                                Perfect!
                              </>
                            ) : gradingResult.level === "good" ? (
                              <>
                                <ThumbsUp className="h-4 w-4 mr-1.5" />
                                Good Answer
                              </>
                            ) : gradingResult.level === "partial" ? (
                              <>
                                <AlertCircle className="h-4 w-4 mr-1.5" />
                                Partially Correct
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1.5" />
                                Needs Improvement
                              </>
                            )}
                          </span>

                          {/* Simple score display */}
                          <span
                            className={`text-sm font-medium ${
                              gradingResult.score >= 90
                                ? "text-green-400"
                                : gradingResult.score >= 70
                                  ? "text-blue-400"
                                  : gradingResult.score >= 40
                                    ? "text-yellow-400"
                                    : "text-red-400"
                            }`}
                          >
                            Score: {gradingResult.score}/100
                          </span>
                        </div>

                        {/* Compact feedback with toggle */}
                        {!showDetailedFeedback ? (
                          <div className="mt-2 flex justify-between items-center">
                            <p className="text-sm text-gray-300 truncate max-w-[70%]">{gradingResult.feedback}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowDetailedFeedback(true)
                              }}
                              className="text-xs text-skyBlue hover:bg-skyBlue/10"
                            >
                              View Feedback
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm text-gray-300">{gradingResult.feedback}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowDetailedFeedback(false)
                                }}
                                className="text-xs text-skyBlue hover:bg-skyBlue/10"
                              >
                                Hide Details
                              </Button>
                            </div>

                            {gradingResult.specificFeedback && gradingResult.specificFeedback.length > 0 && (
                              <div className="mt-2 space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                                {gradingResult.specificFeedback.map((feedback, index) => {
                                  const isCorrect = feedback.startsWith("✓") || feedback.startsWith("+")
                                  const isIncorrect = feedback.startsWith("✗") || feedback.startsWith("-")
                                  const isTip = !isCorrect && !isIncorrect

                                  return (
                                    <div
                                      key={index}
                                      className={`text-xs flex items-start gap-1.5 p-1 rounded ${
                                        isCorrect
                                          ? "bg-green-900/20 text-green-300"
                                          : isIncorrect
                                            ? "bg-red-900/20 text-red-300"
                                            : "bg-blue-900/20 text-blue-300"
                                      }`}
                                    >
                                      <div className="min-w-[14px] mt-0.5">
                                        {isCorrect ? (
                                          <Check className="h-3.5 w-3.5 text-green-400" />
                                        ) : isIncorrect ? (
                                          <X className="h-3.5 w-3.5 text-red-400" />
                                        ) : (
                                          <ArrowRight className="h-3.5 w-3.5 text-blue-400" />
                                        )}
                                      </div>
                                      <span>{feedback.replace(/^[✓✗+-]\s*/, "")}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Add Next Card button on the front side */}
                        <div className="mt-3 flex justify-between">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              flipCard()
                            }}
                            variant="outline"
                            size="sm"
                            className="border-skyBlue/20 hover:border-skyBlue/50 hover:bg-skyBlue/10"
                          >
                            Show Answer
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              // Reset for next card
                              setUserAnswer("")
                              setGradingResult(null)
                              setShowDetailedFeedback(false)

                              // Move to next card
                              if (currentIndex < remainingCards.length - 1) {
                                setCurrentIndex((prev) => prev + 1)
                              } else if (remainingCards.length === 1) {
                                handleFinish()
                              } else {
                                setCurrentIndex(0)
                              }
                            }}
                            className="bg-skyBlue hover:bg-skyBlue/90 text-white"
                          >
                            Next Card
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {!gradingResult && (
                      <div className="flex justify-end mt-3 gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            flipCard()
                          }}
                          variant="outline"
                          size="sm"
                          className="border-skyBlue/20 hover:border-skyBlue/50 hover:bg-skyBlue/10"
                        >
                          Skip & Show Answer
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGradeAnswer()
                          }}
                          size="sm"
                          className="bg-skyBlue hover:bg-skyBlue/90 text-white"
                          disabled={isGrading || !userAnswer.trim()}
                        >
                          {isGrading ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Grading...
                            </>
                          ) : (
                            <>
                              <Brain className="mr-2 h-3 w-3" />
                              Grade Answer
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {!useAIGrading && <div className="text-center mt-4 text-sm text-gray-400">Click to see answer</div>}
              </Card>

              <Card className="w-full p-8 cursor-pointer min-h-[300px] flex flex-col justify-center transition-all duration-300 sky-card card-back hover:shadow-[0_10px_30px_rgba(14,165,233,0.3)]">
                <div className="text-sm uppercase font-semibold text-skyBlue mb-2">Answer</div>
                <div className="text-xl font-medium whitespace-pre-line text-white">{currentCard.answer}</div>

                {useAIGrading && userAnswer && (
                  <div className="mt-4 border-t border-gray-800 pt-4">
                    <div className="text-sm uppercase font-semibold text-gray-400 mb-2">Your Answer:</div>
                    <div className="text-md whitespace-pre-line text-gray-300">{userAnswer}</div>
                  </div>
                )}

                <div className="text-center mt-4 text-sm text-gray-400">Click to see question</div>
              </Card>
            </div>
          </div>
        </div>

        <div className="w-full max-w-2xl mx-auto mb-8">
          <div className="flex flex-wrap gap-4 justify-center mt-6">
            <Button
              onClick={handlePrevious}
              variant="outline"
              size="icon"
              className="rounded-full hover:bg-skyBlue/10 hover:text-skyBlue hover:border-skyBlue/50 transition-all duration-300"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous</span>
            </Button>

            {isFlipped ? (
              <>
                <Button
                  onClick={handleIncorrect}
                  variant="outline"
                  className="gap-2 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500 hover:shadow-[0_5px_15px_rgba(220,38,38,0.3)] transition-all duration-300"
                >
                  <ThumbsDown className="h-4 w-4" />
                  Incorrect
                </Button>
                <Button
                  onClick={handleCorrect}
                  className="gap-2 bg-green-600 hover:bg-green-600/90 text-white hover:shadow-[0_5px_15px_rgba(22,163,74,0.5)] transition-all duration-300"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Correct
                </Button>
              </>
            ) : (
              // Only show the Show Answer button if AI grading is not enabled and no grading result
              !useAIGrading &&
              !gradingResult && (
                <Button
                  onClick={flipCard}
                  className="bg-skyBlue hover:bg-skyBlue/90 text-white hover:shadow-[0_5px_15px_rgba(14,165,233,0.5)] transition-all duration-300"
                >
                  Show Answer
                </Button>
              )
            )}

            <Button
              onClick={handleNext}
              variant="outline"
              size="icon"
              className="rounded-full hover:bg-skyBlue/10 hover:text-skyBlue hover:border-skyBlue/50 transition-all duration-300"
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next</span>
            </Button>
          </div>

          <div className="flex gap-4 justify-center mt-4">
            <Button
              onClick={handleFinish}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-skyBlue hover:bg-skyBlue/10 transition-all duration-300"
            >
              <X className="mr-2 h-4 w-4" />
              Exit
            </Button>
            <Button
              onClick={handleReset}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-skyBlue hover:bg-skyBlue/10 transition-all duration-300 group"
            >
              <RotateCcw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
              Reset
            </Button>
          </div>
        </div>
      </div>
      <style jsx>{animationStyles}</style>
    </>
  )
}
