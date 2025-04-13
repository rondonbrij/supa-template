import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import LoginForm from "@/components/auth/login-form"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // If there's a redirect URL in the query params, use it
    if (resolvedSearchParams.redirect) {
      redirect(resolvedSearchParams.redirect)
    } else {
      redirect("/")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-3xl font-bold">Login to TravelEase</h1>
        <LoginForm redirectUrl={resolvedSearchParams.redirect} />
      </div>
    </div>
  )
}
