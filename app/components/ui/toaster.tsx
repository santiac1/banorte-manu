"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"

import { Toast, ToastDescription, ToastTitle } from "@/app/components/ui/toast"
import { type Toast as ToastType, useToast } from "@/app/components/ui/use-toast"
import { generateId } from "@/lib/id"

export function Toaster() {
  const { toast, dismiss } = useToast()

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => dismiss(), 4000)
    return () => clearTimeout(timer)
  }, [toast, dismiss])

  if (typeof document === "undefined") {
    return null
  }

  return createPortal(
    toast ? (
      <div className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-2">
        <Toast>
          <div className="grid gap-1">
            {toast.title ? <ToastTitle>{toast.title}</ToastTitle> : null}
            {toast.description ? (
              <ToastDescription>{toast.description}</ToastDescription>
            ) : null}
          </div>
        </Toast>
      </div>
    ) : null,
    document.body
  )
}

export function toast(message: ToastType) {
  if (!message.id) {
    message.id = generateId()
  }
  import("./use-toast").then(({ dispatchToast }) => dispatchToast(message))
}
