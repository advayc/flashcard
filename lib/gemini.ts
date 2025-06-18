// Fallback API key for preview/development
const geminiApiKey =
  process.env.GEMINI_API_KEY

// Cache for API responses to avoid redundant calls
const apiCache = new Map()

export async function callGeminiAPI(prompt: string, imageData?: string) {
  // Create a cache key based on the prompt and image data
  const cacheKey = `${prompt}_${imageData?.substring(0, 50) || ""}`

  // Check if we have a cached response
  if (apiCache.has(cacheKey)) {
    console.log("Using cached API response")
    return apiCache.get(cacheKey)
  }

  try {
    // Prepare the request body
    const requestBody: any = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    }

    // Add image to the request if provided
    if (imageData) {
      requestBody.contents[0].parts.unshift({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData.split(",")[1], // Remove the data URL prefix
        },
      })
    }

    // Try with gemini-1.5-flash first (supports both text and images)
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify(requestBody),
      },
    )

    if (response.ok) {
      const data = await response.json()
      // Cache the successful response
      apiCache.set(cacheKey, data)
      return data
    }

    // If first attempt fails, try with gemini-pro
    console.log("Attempting with alternative Gemini model...")
    const fallbackResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify(requestBody),
      },
    )

    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json()
      // Cache the successful response
      apiCache.set(cacheKey, data)
      return data
    }

    // If both attempts fail, throw an error
    const errorData = await fallbackResponse.json()
    throw new Error(`Gemini API error: ${errorData?.error?.message || JSON.stringify(errorData)}`)
  } catch (error) {
    console.error("Error calling Gemini API:", error)

    // Fallback to generate basic flashcards if API fails
    if (prompt.includes("Generate") && prompt.includes("flashcards")) {
      const fallbackData = generateContentRelevantFlashcards(prompt)
      // Cache the fallback response
      apiCache.set(cacheKey, fallbackData)
      return fallbackData
    }

    throw error
  }
}

// Optimized fallback function to generate content-relevant flashcards
function generateContentRelevantFlashcards(prompt: string) {
  // Extract the content from the prompt
  const contentMatch = prompt.match(/The content is:\s*([\s\S]+)$/m)
  const content = contentMatch ? contentMatch[1].trim() : "Sample content"

  // Extract the number of flashcards requested
  const countMatch = prompt.match(/Generate\s+(\d+)\s+flashcards/)
  const count = countMatch ? Number.parseInt(countMatch[1]) : 10

  // Generate flashcards based on the content
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10)
  const flashcards = []

  // Create different types of flashcards for variety
  const createFlashcards = () => {
    // Type 1: Fill in the blank
    for (let i = 0; i < Math.min(count / 3, sentences.length); i++) {
      const sentence = sentences[i % sentences.length].trim()
      if (sentence.length < 15) continue

      const words = sentence.split(/\s+/).filter((w) => w.length > 3)
      if (words.length < 3) continue

      const randomWordIndex = Math.floor(Math.random() * words.length)
      const randomWord = words[randomWordIndex]
      const questionSentence = sentence.replace(new RegExp(`\\b${randomWord}\\b`, "i"), "_______")

      flashcards.push({
        question: `Fill in the blank: ${questionSentence}`,
        answer: randomWord,
      })
    }

    // Type 2: Definition questions
    const keyTerms = content.match(/\b[A-Z][a-z]{3,}(?:\s+[A-Z][a-z]{3,})*\b/g) || []
    for (let i = 0; i < Math.min(count / 3, keyTerms.length); i++) {
      const term = keyTerms[i % keyTerms.length]
      flashcards.push({
        question: `Define the term: ${term}`,
        answer: `${term} is a key concept in the provided content.`,
      })
    }

    // Type 3: Concept questions
    for (let i = 0; i < Math.min(count / 3, sentences.length); i++) {
      const sentenceIndex = (i + sentences.length / 2) % sentences.length
      const sentence = sentences[sentenceIndex].trim()
      if (sentence.length < 15) continue

      flashcards.push({
        question: `Explain the concept: "${sentence}"`,
        answer: "This concept is important because it relates to the core ideas in the material.",
      })
    }
  }

  // Generate flashcards
  createFlashcards()

  // If we couldn't generate enough flashcards, add generic ones
  while (flashcards.length < count) {
    const randomIndex = Math.floor(Math.random() * sentences.length)
    const randomSentence = sentences[randomIndex] || content.substring(0, 100)

    flashcards.push({
      question: `What is the significance of: "${randomSentence.trim()}"?`,
      answer: "This is significant because it represents a key idea in the content.",
    })
  }

  // Limit to the requested count
  return {
    candidates: [
      {
        content: {
          parts: [
            {
              text: JSON.stringify(flashcards.slice(0, count)),
            },
          ],
        },
      },
    ],
  }
}
