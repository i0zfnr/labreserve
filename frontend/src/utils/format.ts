import axios from 'axios'

export function formatDateTime(isoString: string): string {
  if (!isoString) return ''
  try {
    return new Intl.DateTimeFormat('en-MY', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kuala_Lumpur',
    }).format(new Date(isoString))
  } catch {
    return isoString
  }
}

export function formatDateOnly(isoString: string): string {
  if (!isoString) return ''
  try {
    return new Intl.DateTimeFormat('en-MY', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Kuala_Lumpur',
    }).format(new Date(isoString))
  } catch {
    return isoString
  }
}

export function formatTimeOnly(isoString: string): string {
  if (!isoString) return ''
  try {
    return new Intl.DateTimeFormat('en-MY', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kuala_Lumpur',
    }).format(new Date(isoString))
  } catch {
    return isoString
  }
}

export function parseApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    if (data?.errors) {
      const messages = Object.values(data.errors).flat().filter(Boolean)
      if (messages.length > 0) {
        return messages.join(' ')
      }
    }
    return data?.message || err.message || 'Unable to process the request.'
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'An unexpected error occurred.'
}
