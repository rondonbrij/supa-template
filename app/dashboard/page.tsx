import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-3xl font-bold">Your Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Your Bookings</CardTitle>
            <CardDescription>View and manage your current bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">You have no active bookings.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved Destinations</CardTitle>
            <CardDescription>Places you've saved for later</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">You haven't saved any destinations yet.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your profile and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Email: {user.email}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

