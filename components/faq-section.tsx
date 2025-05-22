import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "How does this app generate flashcards?",
    answer:
      "Our app uses advanced AI to analyze your uploaded content (text, PDFs, or images) and automatically creates relevant flashcards. The AI identifies key concepts, definitions, and important information to create question-answer pairs that help you learn effectively.",
  },
  {
    question: "Can I edit the AI-generated flashcards?",
    answer:
      "Yes! While our AI creates high-quality flashcards, you have full control to edit, delete, or add your own flashcards to any set. This gives you the perfect balance between saving time with AI generation and customizing your study materials.",
  },
  {
    question: "What is spaced repetition and how does it work?",
    answer:
      "Spaced repetition is a learning technique that spaces out review sessions over time for optimal memory retention. FlashGenius tracks which cards you find difficult and automatically schedules them for more frequent review, while spacing out cards you know well. This scientifically-proven method helps you learn more efficiently.",
  },
  {
    question: "Can I share my flashcard sets with others?",
    answer:
      "Yes, you can share your flashcard sets with friends or classmates. On the Pro and Team plans, you can collaborate on sets together, making it perfect for study groups or class projects.",
  },
  {
    question: "How does the contribution system work?",
    answer:
      "The contribution system tracks your learning activities and rewards you with contribution points. Activities like creating flashcards, completing study sessions, achieving streaks, and opening the app daily all count as contributions. These are displayed in a GitHub-style contribution graph on your profile, helping you visualize your study habits and stay motivated.",
  },
  {
    question: "Is there a mobile app available?",
    answer:
      "Yes, FlashGenius is available on iOS and Android devices. Your account and flashcards sync across all your devices, so you can study anywhere, anytime. The mobile app also supports offline studying for Pro and Team users.",
  },
  {
    question: "What happens if I exceed my monthly AI-generated flashcard limit?",
    answer:
      "If you reach your monthly limit, you can still create flashcards manually and use all other features. Your limit resets at the beginning of each billing cycle. If you need more AI-generated cards, you can upgrade your plan or purchase additional card packs.",
  },
]

export function FaqSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-black relative" id="faq">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black"></div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl neon-text">
              Frequently Asked Questions
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
              Everything you need to know about our flashcard app
            </p>
          </div>

          <div className="w-full max-w-3xl mt-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b border-skyBlue/10">
                  <AccordionTrigger className="text-left hover:text-skyBlue transition-all py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400 pb-4">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <p className="text-sm text-gray-400 mt-8">
            Still have questions?{" "}
            <a href="#" className="text-skyBlue hover:underline">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
