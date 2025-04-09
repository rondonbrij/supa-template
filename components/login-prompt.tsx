"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface LoginPromptProps {
  isOpen: boolean
  onClose: () => void
  redirectUrl: string
}

export function LoginPrompt({ isOpen, onClose, redirectUrl }: LoginPromptProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = () => {
    router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`)
  }

  const handleSignup = () => {
    router.push(`/signup?redirect=${encodeURIComponent(redirectUrl)}`)
  }

  if (!mounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Login Required</DialogTitle>
          <DialogDescription>
            You need to be logged in to book a trip. Please login or create an account to continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={onClose} className="sm:w-auto w-full">
            Cancel
          </Button>
          <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
            <Button onClick={handleSignup} variant="outline" className="w-full sm:w-auto">
              Sign Up
            </Button>
            <Button onClick={handleLogin} className="w-full sm:w-auto">
              Login
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
