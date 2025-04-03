import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarIcon, Mail, Phone, User } from "lucide-react"
import { format } from "date-fns"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch passenger profile from the passengers table
  const { data: passenger, error } = await supabase
    .from("passengers")
    .select("*")
    .eq("auth_id", session.user.id)
    .single()

  if (error) {
    console.error("Error fetching passenger profile:", error)
    return (
      <div className="container mx-auto py-10">
        <h1 className="mb-6 text-3xl font-bold">Your Profile</h1>
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Profile</CardTitle>
            <CardDescription>
              We encountered an error while loading your profile. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">Error: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Format the birth date if it exists
  const formattedBirthDate = passenger?.birth_date
    ? format(new Date(passenger.birth_date), "MMMM d, yyyy")
    : "Not provided"

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-3xl font-bold">Your Profile</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your personal details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={passenger?.profile_picture || ""}
                  alt={`${passenger?.first_name} ${passenger?.last_name}`}
                />
                <AvatarFallback className="text-2xl">
                  {passenger?.first_name?.[0]}
                  {passenger?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">
                  {passenger?.first_name} {passenger?.last_name}
                </h2>
                <p className="text-muted-foreground">Passenger</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium leading-none">Email</p>
                  <p className="text-sm text-muted-foreground">{passenger?.email || session.user.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium leading-none">Phone Number</p>
                  <p className="text-sm text-muted-foreground">{passenger?.phone || "Not provided"}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium leading-none">Date of Birth</p>
                  <p className="text-sm text-muted-foreground">{formattedBirthDate}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account settings and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a href="/profile/edit" className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium leading-none">Edit Profile</p>
                  <p className="text-sm text-muted-foreground">Update your personal information</p>
                </div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </a>

            <a
              href="/profile/bookings"
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted"
            >
              <div className="flex items-center space-x-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-muted-foreground"
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
                </svg>
                <div>
                  <p className="text-sm font-medium leading-none">My Bookings</p>
                  <p className="text-sm text-muted-foreground">View your booking history</p>
                </div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </a>

            <a
              href="/profile/security"
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted"
            >
              <div className="flex items-center space-x-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-muted-foreground"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <div>
                  <p className="text-sm font-medium leading-none">Security</p>
                  <p className="text-sm text-muted-foreground">Manage your password and security settings</p>
                </div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

