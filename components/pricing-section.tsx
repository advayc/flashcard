import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"

const pricingPlans = [
  {
    name: "Free",
    description: "Perfect for getting started",
    price: "$0",
    period: "forever",
    features: [
      "Create up to 5 flashcard sets",
      "50 AI-generated flashcards per month",
      "Basic spaced repetition",
      "Text-based flashcards",
      "Community support",
    ],
    buttonText: "Get Started",
    buttonVariant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    description: "For serious students",
    price: "$9.99",
    period: "per month",
    features: [
      "Unlimited flashcard sets",
      "500 AI-generated flashcards per month",
      "Advanced spaced repetition",
      "Image and PDF support",
      "Priority support",
      "Detailed analytics",
      "Offline access",
    ],
    buttonText: "Start Free Trial",
    buttonVariant: "default" as const,
    popular: true,
  },
  {
    name: "Team",
    description: "For study groups & classes",
    price: "$19.99",
    period: "per month",
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Collaborative flashcard creation",
      "Shared study sessions",
      "Team analytics",
      "Admin controls",
      "Dedicated support",
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-black relative" id="pricing">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black"></div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl neon-text">
              Simple, Transparent Pricing
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
              Choose the plan that's right for you and start learning more effectively today
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`sky-card overflow-hidden transition-all duration-300 hover:translate-y-[-5px] ${
                  plan.popular
                    ? "border-skyBlue hover:shadow-[0_8px_25px_rgba(14,165,233,0.4)]"
                    : "hover:shadow-[0_8px_25px_rgba(14,165,233,0.3)]"
                }`}
              >
                {plan.popular && (
                  <div className="bg-skyBlue text-white text-xs font-medium px-3 py-1 text-center">Most Popular</div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-400 ml-2">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 text-sm">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-skyBlue" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    variant={plan.buttonVariant}
                    className={`w-full ${
                      plan.buttonVariant === "default"
                        ? "bg-skyBlue hover:bg-skyBlue/90 text-white"
                        : "border-skyBlue/30 hover:border-skyBlue hover:bg-skyBlue/10 text-skyBlue"
                    }`}
                  >
                    <Link href="/signup">{plan.buttonText}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <p className="text-sm text-gray-400 mt-8">
            All plans include a 14-day money-back guarantee. No credit card required for free plan.
          </p>
        </div>
      </div>
    </section>
  )
}
