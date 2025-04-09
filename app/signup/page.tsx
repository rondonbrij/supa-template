import { redirect } from "next/navigation"
import SignupForm from "@/components/auth/signup-form"
import { createClient } from "@/lib/supabase/server"

export default async function SignupPage({ searchParams }: { searchParams: { redirect?: string } }) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    // If there's a redirect URL in the query params, use it
    if (searchParams.redirect) {
      redirect(searchParams.redirect)
    } else {
      redirect("/profile")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-3xl font-bold">Sign up for TravelEase</h1>
        <SignupForm redirectUrl={searchParams.redirect} />
      </div>
    </div>
  )
}
