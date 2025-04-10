import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ProfileForm from "@/components/profile/profile-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Header from "@/components/header"

export default async function EditProfilePage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Update the edit profile page to use the profiles table

  // Replace the passenger query with profiles query
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).single()

  if (error) {
    console.error("Error fetching profile:", error)
  }

  return (
    <>
      <Header />
      <div className="container mx-auto py-10">
        <h1 className="mb-6 text-3xl font-bold">Edit Profile</h1>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details and contact information</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Update the ProfileForm component call */}
            <ProfileForm initialData={profile} userId={session.user.id} userEmail={session.user.email || ""} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
