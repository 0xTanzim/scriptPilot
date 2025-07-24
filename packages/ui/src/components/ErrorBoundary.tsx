import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary component for graceful error handling
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for development
    console.error(
      '[ScriptPilot Error Boundary] Component error caught:',
      error
    );
    console.error('[ScriptPilot Error Boundary] Error info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className='h-full flex items-center justify-center bg-background p-8'>
          <div className='max-w-md mx-auto text-center space-y-4'>
            <div className='text-6xl'>⚠️</div>
            <h2 className='text-2xl font-bold text-destructive'>
              Something went wrong
            </h2>
            <p className='text-muted-foreground'>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='text-left bg-muted p-4 rounded-md'>
                <summary className='cursor-pointer font-medium mb-2'>
                  Error Details (Development)
                </summary>
                <pre className='text-xs overflow-auto'>
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className='text-xs overflow-auto mt-2'>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div className='space-x-2'>
              <button
                onClick={this.handleRetry}
                className='px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className='px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors'
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
