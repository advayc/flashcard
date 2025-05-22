import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Memoize function for expensive calculations
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map()

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = func(...args)
    cache.set(key, result)
    return result
  }) as T
}

// Format date with optimization
export function formatDate(date: Date | string): string {
  if (typeof date === "string") {
    date = new Date(date)
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

// Optimize image URLs for better loading
export function optimizeImageUrl(url: string, width = 400): string {
  if (!url) return "/placeholder.svg"

  // If it's already a placeholder, add dimensions
  if (url.includes("placeholder.svg")) {
    return `/placeholder.svg?height=${width}&width=${width}`
  }

  // If it's an external URL that supports optimization
  if (url.includes("images.unsplash.com")) {
    return `${url}&w=${width}&q=75`
  }

  return url
}

// Truncate text with ellipsis
export function truncateText(text: string, length = 100): string {
  if (!text || text.length <= length) return text
  return text.slice(0, length) + "..."
}
