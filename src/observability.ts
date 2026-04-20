import * as Sentry from '@sentry/react'

let initialized = false

function isEnabled(): boolean {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  return Boolean(dsn && String(dsn).trim().length > 0)
}

export function initObservability(): void {
  if (initialized) return

  if (isEnabled()) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.05),
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      sendDefaultPii: false,
    })
  }

  window.addEventListener('error', (event) => {
    captureError(event.error ?? new Error(event.message || 'Window error'))
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    captureError(reason)
  })

  initialized = true
}

export function captureError(error: unknown, context?: Record<string, string>): void {
  if (isEnabled()) {
    Sentry.withScope((scope) => {
      if (context) {
        for (const [k, v] of Object.entries(context)) {
          scope.setTag(k, v)
        }
      }

      if (error instanceof Error) {
        Sentry.captureException(error)
      } else {
        Sentry.captureMessage(String(error), 'error')
      }
    })
    return
  }

  console.error('observability capture:', { error, context })
}
