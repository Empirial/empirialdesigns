import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Rendered instead of children once an error is caught. `reset` clears the
   * caught error and re-renders `children` fresh — it doesn't fix whatever
   * caused the crash, so if the underlying state is still bad this will
   * throw again immediately; that's expected, not a bug in the boundary. */
  fallback: (error: Error, reset: () => void) => ReactNode;
  /** Mirrors componentDidCatch — use for logging, not for recovery. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * A scoped error boundary for wrapping one risky subtree (e.g. the live
 * Sandpack preview, which can throw from inside third-party bundler
 * internals on malformed AI-generated code) instead of relying on the
 * app-wide boundary in main.tsx. That one sits above the entire <App/> and
 * would otherwise blank out the whole editor — chat included — for a crash
 * contained to a single workspace panel.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error, () => this.setState({ error: null }));
    }
    return this.props.children;
  }
}
