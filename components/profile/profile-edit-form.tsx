"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/provider"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Upload, X } from "lucide-react"

interface ProfileEditFormProps {
  userId: string
  initialData: {
    full_name?: string
    avatar_url?: string
    email?: string
  }
  onCancel: () => void
}

export function ProfileEditForm({ userId, initialData, onCancel }: ProfileEditFormProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData.avatar_url || null)
  const [formData, setFormData] = useState({
    full_name: initialData.full_name || "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      })
      return
    }

    setAvatarFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const clearAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let avatarUrl = initialData.avatar_url

      // Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop()
        const filePath = `avatars/${userId}-${Date.now()}.${fileExt}`

        const { error: uploadError, data } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath)
        avatarUrl = publicUrlData.publicUrl
      } else if (avatarPreview === null && initialData.avatar_url) {
        // Avatar was cleared
        avatarUrl = null
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (updateError) throw updateError

      // Track contribution for profile update
      await supabase.from("user_contributions").insert([
        {
          user_id: userId,
          contribution_type: "profile_updated",
          contribution_value: 1,
          metadata: {
            updated_fields: ["full_name", avatarFile ? "avatar" : null].filter(Boolean),
          },
        },
      ])

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })

      // Refresh the page to show updated data
      router.refresh()
      onCancel() // Close edit mode
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get initials for avatar fallback
  const initials = formData.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)

  return (
    <Card className="sky-card">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Edit Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-skyBlue/20">
                <AvatarImage src={avatarPreview || undefined} alt={formData.full_name} />
                <AvatarFallback className="text-xl bg-skyBlue/10 text-skyBlue">{initials}</AvatarFallback>
              </Avatar>
              {avatarPreview && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={clearAvatar}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div>
              <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("avatar")?.click()}
                className="gap-2 border-skyBlue/20 hover:border-skyBlue/50 transition-all"
              >
                <Upload className="h-3.5 w-3.5" />
                {avatarPreview ? "Change Avatar" : "Upload Avatar"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-gray-300">
              Full Name
            </Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className="sky-input"
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">
              Email
            </Label>
            <Input
              id="email"
              value={initialData.email || ""}
              disabled
              className="sky-input bg-gray-900/50 text-gray-400"
            />
            <p className="text-xs text-gray-500">Email cannot be changed</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-skyBlue/20 hover:border-skyBlue/50 transition-all"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" className="bg-skyBlue hover:bg-skyBlue/90 text-white" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
