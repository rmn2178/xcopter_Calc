import { Component, type ErrorInfo, type ReactNode } from 'react'
import { captureError } from '../observability'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureError(error, { boundary: 'ErrorBoundary' })
    console.error('Unhandled UI error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-shell" role="alert">
          <section className="fatal-card">
            <h1>Something went wrong</h1>
            <p>The calculator hit an unexpected error.</p>
            <button onClick={() => window.location.reload()}>Reload</button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
