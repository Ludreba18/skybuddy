import { Component, ReactNode } from "react";
import { logError } from "@/lib/errorLogger";
import { Plane } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    logError("react-error-boundary", error, {
      context: { componentStack: info.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6 text-center">
          <Plane className="w-12 h-12 text-primary" />
          <h1 className="text-xl font-bold font-heading">Etwas ist schiefgelaufen</h1>
          <p className="text-muted-foreground max-w-sm">
            Der Fehler wurde automatisch gemeldet. Bitte lade die Seite neu.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium"
          >
            Seite neu laden
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
