"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/browser"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define the form schema
const profileFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  birthDate: z.date({
    required_error: "Date of birth is required",
  }),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  initialData: any
  userId: string
  userEmail: string
}

export default function ProfileForm({ initialData, userId, userEmail }: ProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Set default values from the initialData
  const defaultValues: Partial<ProfileFormValues> = {
    firstName: initialData?.first_name || "",
    lastName: initialData?.last_name || "",
    email: userEmail || "",
    phone: initialData?.phone || "",
    birthDate: initialData?.birth_date ? new Date(initialData.birth_date) : undefined,
  }

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange", // Trigger validation on change
  })

  // Use useEffect to set the form values after initialData is loaded
  useEffect(() => {
    if (initialData) {
      form.reset({
        firstName: initialData.first_name || "",
        lastName: initialData.last_name || "",
        email: userEmail || "",
        phone: initialData.phone || "",
        birthDate: initialData.birth_date ? new Date(initialData.birth_date) : undefined,
      })
    }
  }, [initialData, userEmail, form])

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true)
    setMessage(null)
    setError(null)

    try {
      // Update the passenger record
      const { error } = await supabase
        .from("passengers")
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          birth_date: data.birthDate.toISOString().split("T")[0],
        })
        .eq("auth_id", userId)

      if (error) {
        throw error
      }

      setMessage("Profile updated successfully")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to update profile")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.doe@example.com" {...field} disabled />
                </FormControl>
                <FormDescription>Email cannot be changed.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="+1234567890" {...field} />
                </FormControl>
                <FormDescription>Enter your phone number in international format.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Birth</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex flex-col space-y-4 p-2">
                      <div className="flex justify-between">
                        <select
                          value={field.value ? field.value.getFullYear() : new Date().getFullYear() - 30}
                          onChange={(e) => {
                            const year = Number.parseInt(e.target.value)
                            const newDate = field.value ? new Date(field.value) : new Date()
                            newDate.setFullYear(year)
                            field.onChange(newDate)
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
                          value={field.value ? field.value.getMonth() : 0}
                          onChange={(e) => {
                            const month = Number.parseInt(e.target.value)
                            const newDate = field.value ? new Date(field.value) : new Date()
                            newDate.setMonth(month)
                            field.onChange(newDate)
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
                        selected={field.value}
                        onSelect={field.onChange}
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
                <FormDescription>You must be at least 18 years old.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}

