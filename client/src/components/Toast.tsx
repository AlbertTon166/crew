import { toast as sonnerToast } from 'sonner'

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

// Unified toast function
export function showToast(
  message: string,
  type: ToastType = 'info',
  options?: { duration?: number; action?: { label: string; onClick: () => void } }
) {
  const { duration = 4000, action } = options || {}

  switch (type) {
    case 'success':
      sonnerToast.success(message, { duration, action })
      break
    case 'error':
      sonnerToast.error(message, { duration, action })
      break
    case 'warning':
      sonnerToast.warning(message, { duration, action })
      break
    case 'loading':
      sonnerToast.loading(message, { duration })
      break
    default:
      sonnerToast(message, { duration, action })
  }
}

// Convenience methods
export const toast = {
  success: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) =>
    showToast(message, 'success', options),
  error: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) =>
    showToast(message, 'error', options),
  warning: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) =>
    showToast(message, 'warning', options),
  info: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) =>
    showToast(message, 'info', options),
  loading: (message: string, options?: { duration?: number }) =>
    showToast(message, 'loading', options),
}

export default toast
