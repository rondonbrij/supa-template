"use client"

import type React from "react"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/browser"
import { cn } from "@/lib/utils"

interface ProfileFormProps {
  initialData: any
  userId: string
  userEmail: string | undefined
}

export default function ProfileForm({ initialData, userId, userEmail }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [firstName, setFirstName] = useState(initialData?.first_name || "")
  const [lastName, setLastName] = useState(initialData?.last_name || "")
  const [email, setEmail] = useState(initialData?.email || userEmail || "")
  const [phone, setPhone] = useState(initialData?.phone || "")
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    initialData?.birth_date ? new Date(initialData.birth_date) : undefined,
  )
  const [profilePicture, setProfilePicture] = useState(initialData?.profile_picture || "")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const router = useRouter()
  const supabase = createClient()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!firstName || firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters."
    }

    if (!lastName || lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters."
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Please enter a valid email address."
    }

    if (phone && !/^\+?[1-9]\d{1,14}$/.test(phone)) {
      newErrors.phone = "Please enter a valid phone number."
    }

    if (!birthDate) {
      newErrors.birthDate = "Please select a date of birth."
    } else {
      const today = new Date()
      const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
      if (birthDate > eighteenYearsAgo) {
        newErrors.birthDate = "You must be at least 18 years old."
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      if (initialData) {
        // Update existing profile
        const { error } = await supabase
          .from("passengers")
          .update({
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone || null,
            birth_date: birthDate?.toISOString().split("T")[0],
            profile_picture: profilePicture,
            updated_at: new Date().toISOString(),
          })
          .eq("id", initialData.id)

        if (error) throw error
      } else {
        // Create new profile
        const { error } = await supabase.from("passengers").insert({
          auth_id: userId,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone || null,
          birth_date: birthDate?.toISOString().split("T")[0],
          profile_picture: profilePicture,
        })

        if (error) throw error
      }

      router.refresh()
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `profile-pictures/${fileName}`

      const { error: uploadError } = await supabase.storage.from("passenger-photos").upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage.from("passenger-photos").getPublicUrl(filePath)

      setProfilePicture(data.publicUrl)
    } catch (error) {
      console.error("Error uploading avatar:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-col items-center space-y-4 sm:flex-row sm:items-start sm:space-x-4 sm:space-y-0">
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
                type="button"
                variant="outline"
                onClick={() => document.getElementById("picture")?.click()}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>Upload Image</>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" placeholder="+1234567890" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Enter your phone number in international format (e.g., +1234567890)
            </p>
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Date of Birth</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="birthDate"
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !birthDate && "text-muted-foreground")}
                >
                  {birthDate ? format(birthDate, "PPP") : <span>Pick a date</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={birthDate}
                  onSelect={setBirthDate}
                  disabled={(date) => {
                    const today = new Date()
                    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
                    return date > eighteenYearsAgo || date < new Date(1900, 0, 1)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">You must be at least 18 years old to create an account.</p>
            {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate}</p>}
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {initialData ? "Update Profile" : "Create Profile"}
      </Button>
    </form>
  )
}

