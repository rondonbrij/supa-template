"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/browser"
import { cn } from "@/lib/utils"

// Update the props interface to include redirectUrl
export default function SignupForm({ redirectUrl }: { redirectUrl?: string }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [birthDate, setBirthDate] = useState<Date | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const validateForm = () => {
    // Reset errors
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    // Validate first name and last name
    if (!firstName || firstName.length < 2) {
      setError("First name must be at least 2 characters")
      return false
    }

    if (!lastName || lastName.length < 2) {
      setError("Last name must be at least 2 characters")
      return false
    }

    // Validate birth date
    if (!birthDate) {
      setError("Please select your date of birth")
      return false
    }

    // Check if user is at least 18 years old
    const today = new Date()
    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
    if (birthDate > eighteenYearsAgo) {
      setError("You must be at least 18 years old to sign up")
      return false
    }

    // Validate phone number if provided
    if (phone && !/^\+?[1-9]\d{1,14}$/.test(phone)) {
      setError("Please enter a valid phone number in international format (e.g., +1234567890)")
      return false
    }

    return true
  }

  // Update the handleSubmit function to store the redirectUrl
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    if (!validateForm()) {
      setIsLoading(false)
      return
    }

    try {
      // Sign up with email and password, and include user metadata
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
            ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectUrl)}`
            : `${window.location.origin}/auth/callback`,
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
            birth_date: birthDate?.toISOString().split("T")[0],
          },
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      setMessage("Check your email for the confirmation link")

      // Redirect to main page after 3 seconds
      setTimeout(() => {
        router.push("/")
      }, 3000)
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
        <CardDescription>Create a new account to get started</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input id="phone" placeholder="+1234567890" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Enter your phone number in international format (e.g., +1234567890)
            </p>
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
                <div className="flex flex-col space-y-4 p-2">
                  <div className="flex justify-between">
                    <select
                      value={birthDate ? birthDate.getFullYear() : new Date().getFullYear() - 30}
                      onChange={(e) => {
                        const year = Number.parseInt(e.target.value)
                        const newDate = birthDate ? new Date(birthDate) : new Date()
                        newDate.setFullYear(year)
                        setBirthDate(newDate)
                      }}
                      className="px-2 py-1 border rounded-md text-sm"
                    >
                      {Array.from({ length: 100 }, (_, i) => {
                        const year = new Date().getFullYear() - 18 - i
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        )
                      })}
                    </select>
                    <select
                      value={birthDate ? birthDate.getMonth() : 0}
                      onChange={(e) => {
                        const month = Number.parseInt(e.target.value)
                        const newDate = birthDate ? new Date(birthDate) : new Date()
                        newDate.setMonth(month)
                        setBirthDate(newDate)
                      }}
                      className="px-2 py-1 border rounded-md text-sm"
                    >
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((month, index) => (
                        <option key={month} value={index}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
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
                </div>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">You must be at least 18 years old to create an account.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
