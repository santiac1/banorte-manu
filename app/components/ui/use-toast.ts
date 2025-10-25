"use client"

import * as React from "react"

const TOAST_LIMIT = 1

type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactElement
}

type Toast = ToasterToast & {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const listeners = new Set<(toast: Toast) => void>()
let queue: Toast[] = []

export function useToast() {
  const [toast, setToast] = React.useState<Toast | null>(null)

  React.useEffect(() => {
    const listener = (toast: Toast) => {
      setToast(toast)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return {
    toast,
    dismiss: () => setToast(null),
  }
}

export function dispatchToast(toast: Toast) {
  queue = queue.filter((t) => t.id !== toast.id)
  queue.push(toast)

  if (queue.length > TOAST_LIMIT) {
    queue = queue.slice(queue.length - TOAST_LIMIT)
  }

  for (const listener of listeners) {
    listener(queue[queue.length - 1])
  }
}

export type { Toast }
