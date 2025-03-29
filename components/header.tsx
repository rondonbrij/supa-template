"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/browser"
import type { User } from "@supabase/supabase-js"

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
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
            className="h-6 w-6 text-primary"
          >
            <path d="M2 12h20" />
            <path d="M2 20h20" />
            <path d="M5 12v8" />
            <path d="M19 12v8" />
            <path d="M5 4v8" />
            <path d="M19 4v8" />
            <path d="M10 4v8" />
            <path d="M14 4v8" />
            <path d="M10 12v8" />
            <path d="M14 12v8" />
            <path d="M2 4h20" />
          </svg>
          <span className="text-xl font-bold">TravelEase</span>
        </Link>
        <nav className="hidden md:flex md:items-center md:space-x-6">
          <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Destinations
          </Link>
          <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Hotels
          </Link>
          <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Flights
          </Link>
          <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Deals
          </Link>
          <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            About
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          {!loading &&
            (user ? (
              <>
                <span className="hidden text-sm md:inline-block">Hello, {user.email?.split("@")[0]}</span>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden md:inline-flex">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            ))}
          <Button variant="ghost" size="icon" className="md:hidden">
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
              className="h-6 w-6"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

