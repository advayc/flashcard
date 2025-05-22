"use client"

import type React from "react"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/provider"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Upload, FileText, AlertCircle } from "lucide-react"
import { TextUpload } from "@/components/create/text-upload"
import { FileUpload } from "@/components/create/file-upload"
import { callGeminiAPI } from "@/lib/gemini"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function CreateFlashcardForm({ userId }: { userId: string }) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [imageData, setImageData] = useState<string | null>(null)
  const [numFlashcards, setNumFlashcards] = useState(10)

  // Memoize the validation function to avoid unnecessary recalculations
  const isFormValid = useMemo(() => {
    return title.trim() !== "" && (content.trim() !== "" || file !== null) && numFlashcards >= 1 && numFlashcards <= 50
  }, [title, content, file, numFlashcards])

  // Use useCallback to memoize the createFlashcards function
  const createFlashcards = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (!isFormValid) {
        if (!title) {
          toast({
            title: "Title required",
            description: "Please provide a title for your flashcard set.",
            variant: "destructive",
          })
        } else if (!content && !file) {
          toast({
            title: "Content required",
            description: "Please provide text or upload a file to generate flashcards.",
            variant: "destructive",
          })
        } else if (numFlashcards < 1 || numFlashcards > 50) {
          toast({
            title: "Invalid number of flashcards",
            description: "Please enter a number between 1 and 50.",
            variant: "destructive",
          })
        }
        return
      }

      setIsLoading(true)

      try {
        // Create flashcard set
        const { data: flashcardSet, error: setError } = await supabase
          .from("flashcard_sets")
          .insert([
            {
              title,
              description: description || null,
              user_id: userId,
            },
          ])
          .select()
          .single()

        if (setError) throw setError

        let textContent = content

        // If file is uploaded, handle file processing
        if (file) {
          // For PDFs, extract text content
          if (file.type === "application/pdf") {
            // In a real implementation, you would handle PDF text extraction here
            // For now, we'll just use the file name as a placeholder
            textContent = `Content from PDF: ${file.name}`
          }
        }

        // Generate flashcards with Gemini API
        const flashcards = await generateFlashcardsWithGeminiAPI(textContent, numFlashcards, imageData)

        // Insert generated flashcards
        const { error: cardsError } = await supabase.from("flashcards").insert(
          flashcards.map((card) => ({
            ...card,
            set_id: flashcardSet.id,
          })),
        )

        if (cardsError) throw cardsError

        // Track contribution for creating a flashcard set
        await supabase.from("user_contributions").insert([
          {
            user_id: userId,
            contribution_type: "set_created",
            contribution_value: 1,
            metadata: {
              set_id: flashcardSet.id,
              card_count: flashcards.length,
              title: title,
            },
          },
        ])

        // Check if this is first contribution of the day
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data: todayContributions } = await supabase
          .from("user_contributions")
          .select("created_at")
          .eq("user_id", userId)
          .gte("created_at", today.toISOString())
          .order("created_at", { ascending: true })
          .limit(1)

        // If this is the first contribution of the day, add bonus
        if (!todayContributions || todayContributions.length === 0) {
          await supabase.from("user_contributions").insert([
            {
              user_id: userId,
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
          title: "Flashcards created",
          description: `Created ${flashcards.length} flashcards successfully.`,
        })

        router.push(`/study/${flashcardSet.id}`)
      } catch (error: any) {
        console.error("Error creating flashcards:", error)
        setError(error.message)
        toast({
          title: "Error creating flashcards",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [isFormValid, title, content, file, numFlashcards, imageData, userId, supabase, toast, router],
  )

  // Generate flashcards with Gemini API
  const generateFlashcardsWithGeminiAPI = async (text: string, count: number, imageData: string | null) => {
    try {
      const prompt = `
Generate ${count} flashcards from the following content${imageData ? " and image" : ""}. 
Make sure the flashcards are directly relevant to the content provided.
Each flashcard should have a clear question and answer that helps with learning the material.
Format the output as a JSON array of objects, each with 'question' and 'answer' fields.
${imageData ? "If there's an image, include questions about what's shown in the image.\n" : ""}
The content is:

${text}
`

      const data = await callGeminiAPI(prompt, imageData || undefined)

      // Updated to handle the new response format
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error("Unexpected API response format:", data)
        throw new Error("Received an invalid response from the AI model")
      }

      // Extract text from response
      const generatedText = data.candidates[0].content.parts[0].text

      // Extract JSON from the generated text
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.error("Could not extract JSON from response:", generatedText)
        throw new Error("Could not extract valid JSON from the API response")
      }

      // Parse the JSON
      const flashcards = JSON.parse(jsonMatch[0])

      // Validate the flashcards
      if (!Array.isArray(flashcards) || !flashcards.length) {
        throw new Error("Invalid or empty flashcards generated")
      }

      return flashcards.map((card) => ({
        question: card.question,
        answer: card.answer,
      }))
    } catch (error: any) {
      console.error("Error generating flashcards:", error)

      // Create basic flashcards from the content if API fails
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10)
      const basicFlashcards = []

      // Generate at least some flashcards from the content
      for (let i = 0; i < Math.min(count, sentences.length); i++) {
        const sentence = sentences[i].trim()
        if (sentence.length < 15) continue

        // Create a question from the sentence
        const words = sentence.split(/\s+/).filter((w) => w.length > 3)
        if (words.length < 3) continue

        basicFlashcards.push({
          question: `What does this mean: "${sentence}"?`,
          answer: `This refers to a key concept in the provided content.`,
        })
      }

      // Add some generic flashcards if we couldn't generate enough
      while (basicFlashcards.length < count) {
        basicFlashcards.push({
          question: `Important concept from the content: "${text.substring(0, 50)}..."`,
          answer: "This is a key concept from the provided material.",
        })
      }

      toast({
        title: "Using simplified flashcards",
        description: "We encountered an issue with the AI service, but created basic flashcards for you.",
      })

      return basicFlashcards
    }
  }

  return (
    <Card className="sky-card">
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-950/30 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={createFlashcards}>
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-300">
                Title
              </Label>
              <Input
                id="title"
                placeholder="Enter a title for your flashcard set"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="sky-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Add a description for your flashcard set"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="sky-input resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numFlashcards" className="text-gray-300">
                Number of Flashcards
              </Label>
              <Input
                id="numFlashcards"
                type="number"
                min="1"
                max="50"
                value={numFlashcards}
                onChange={(e) => setNumFlashcards(Number.parseInt(e.target.value))}
                className="sky-input"
              />
              <p className="text-xs text-gray-400">Enter a number between 1 and 50</p>
            </div>

            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/60 border border-skyBlue/20">
                <TabsTrigger
                  value="text"
                  className="flex items-center gap-2 data-[state=active]:bg-skyBlue/10 data-[state=active]:text-skyBlue"
                >
                  <FileText className="h-4 w-4" />
                  Text
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="flex items-center gap-2 data-[state=active]:bg-skyBlue/10 data-[state=active]:text-skyBlue"
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-4">
                <TextUpload content={content} setContent={setContent} />
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <FileUpload file={file} setFile={setFile} imageData={imageData} setImageData={setImageData} />
              </TabsContent>
            </Tabs>

            <Button
              type="submit"
              className="w-full bg-skyBlue hover:bg-skyBlue/90 text-white"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating {numFlashcards} Flashcards...
                </>
              ) : (
                `Create ${numFlashcards} Flashcards`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
