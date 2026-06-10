'use client'

import { CheckCircle2, AlertCircle } from 'lucide-react'

import { useToast } from './use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeThreshold={120}>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant,
        ...props
      }) {
        const Icon =
          variant === 'success'
            ? CheckCircle2
            : variant === 'destructive'
              ? AlertCircle
              : null

        return (
          <Toast key={id} variant={variant} {...props}>
            {Icon && <Icon className="h-5 w-5 shrink-0" aria-hidden />}
            <div className="grid flex-1 gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
