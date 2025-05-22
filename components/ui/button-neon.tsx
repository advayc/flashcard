import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:transform hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        default:
          "relative bg-black text-white border border-neon-blue shadow-neon-sm hover:shadow-neon-md after:absolute after:inset-0 after:rounded-md after:bg-gradient-to-r after:from-neon-blue after:to-neon-cyan after:opacity-0 hover:after:opacity-20 after:transition-opacity",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-neon-blue/50 bg-transparent hover:border-neon-blue hover:shadow-neon-sm text-neon-blue",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-neon-blue/10 hover:text-neon-blue",
        link: "text-neon-blue underline-offset-4 hover:underline",
        glow: "relative bg-black text-white border border-neon-blue shadow-neon-md hover:shadow-neon-lg after:absolute after:inset-0 after:rounded-md after:bg-gradient-to-r after:from-neon-blue after:to-neon-cyan after:opacity-10 hover:after:opacity-30 after:transition-opacity animate-pulse-glow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const ButtonNeon = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
ButtonNeon.displayName = "ButtonNeon"

export { ButtonNeon, buttonVariants }
