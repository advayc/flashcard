import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Quote } from "lucide-react"

const testimonials = [
  {
    quote:
      "This flashcard app has completely transformed how I study. The AI-generated flashcards save me hours of time, and the spaced repetition system helps me retain information much better.",
    author: "Sarah Johnson",
    role: "Medical Student",
    avatar: "/placeholder.svg?height=80&width=80",
  },
  {
    quote:
      "I've tried many flashcard apps, but none compare to this one. The ability to upload my lecture slides and instantly get quality flashcards is game-changing.",
    author: "Michael Chen",
    role: "Computer Science Major",
    avatar: "/placeholder.svg?height=80&width=80",
  },
  {
    quote:
      "The contribution system keeps me motivated to study every day. I love seeing my streak grow and competing with my classmates.",
    author: "Emily Rodriguez",
    role: "Law Student",
    avatar: "/placeholder.svg?height=80&width=80",
  },
]

export function TestimonialSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-black relative">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black"></div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl neon-text">
              What Our Users Say
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
              Join thousands of students who are already studying smarter with our flashcard app
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="sky-card overflow-hidden transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_8px_25px_rgba(14,165,233,0.3)]"
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <Quote className="h-8 w-8 text-skyBlue/40 mb-4" />
                  <p className="text-gray-300 flex-1 mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center mt-auto">
                    <Avatar className="h-10 w-10 mr-3 border border-skyBlue/20">
                      <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.author} />
                      <AvatarFallback className="bg-skyBlue/10 text-skyBlue">
                        {testimonial.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-white">{testimonial.author}</p>
                      <p className="text-xs text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
