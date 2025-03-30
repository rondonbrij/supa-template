"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/browser"
import { Loader2, Upload } from "lucide-react"

interface ProfileAvatarProps {
  userId: string
  profilePicture?: string
  firstName: string
  lastName: string
  onUpdate: (url: string) => void
}

export default function ProfileAvatar({ userId, profilePicture, firstName, lastName, onUpdate }: ProfileAvatarProps) {
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `profile-pictures/${fileName}`

      const { error: uploadError } = await supabase.storage.from("passenger-photos").upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage.from("passenger-photos").getPublicUrl(filePath)

      onUpdate(data.publicUrl)
    } catch (error) {
      console.error("Error uploading avatar:", error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className="h-24 w-24">
        <AvatarImage src={profilePicture || "/placeholder.svg?height=96&width=96"} />
        <AvatarFallback>
          {firstName?.charAt(0)}
          {lastName?.charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="picture" className="text-center">
          Profile Picture
        </Label>
        <div className="flex items-center gap-2">
          <Input id="picture" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <Button
            variant="outline"
            onClick={() => document.getElementById("picture")?.click()}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

