"use client"

import * as React from "react"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 100000

type ToasterProps = {
  children: React.ReactNode
}

function Toaster({ children }: ToasterProps) {
  return (
    <ToastProvider limit={TOAST_LIMIT} removeDelay={TOAST_REMOVE_DELAY}>
      {children}
      <ToastViewport />
    </ToastProvider>
  )
}

type ToastProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const toast = React.useCallback(
    ({ ...props }: ToastProps) => {
      setToasts([...toasts, props])
    },
    [toasts],
  )

  return {
    toasts,
    toast,
  }
}

export { Toaster, Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport, useToast }

export const toast = (options: ToastProps) => {
  // This is a placeholder. In a real implementation, you would likely use a context
  // or a global state management solution to handle the toast notifications.
  console.log("Toast:", options)
}

