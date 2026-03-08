import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
          <div className="text-center p-8 max-w-md">
            <AlertTriangle size={48} className="mx-auto mb-4 text-destructive" />
            <h1 className="text-xl font-bold text-foreground mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-4 text-sm">
              The canvas encountered an error. Please reload to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
            >
              <RefreshCw size={16} /> Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
