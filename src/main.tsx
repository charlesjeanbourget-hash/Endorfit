import React, {StrictMode, ErrorInfo, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  componentDidMount() {
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.addEventListener('error', this.handleErrorEvent);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleErrorEvent);
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error("Unhandled promise rejection:", event.reason);
    const errorStr = String(event.reason);
    // Ignore benign websocket errors and specific Firebase network errors that shouldn't crash the whole UI
    if (errorStr.includes('WebSocket') || errorStr.includes('Failed to fetch')) {
      event.preventDefault();
      return;
    }
    // Only crash for specific unhandled JSON errors we throw intentionally (like Firestore security errors)
    try {
      const msg = event.reason instanceof Error ? event.reason.message : String(event.reason);
      if (msg.includes('{"error"')) {
        this.setState({ hasError: true, error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)) });
      }
    } catch(e) {}
  };

  handleErrorEvent = (event: ErrorEvent) => {
    this.setState({ hasError: true, error: event.error });
  };

  render() {
    if (this.state.hasError) {
      let errorMessage = "Une erreur inattendue s'est produite.";
      let errorDetails = null;
      
      try {
        if (this.state.error?.message) {
          const parsedError = JSON.parse(this.state.error.message);
          if (parsedError.error) {
            errorMessage = "Erreur de base de données : " + parsedError.error;
            errorDetails = parsedError;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Oups ! Quelque chose s'est mal passé.</h1>
            <p className="text-slate-300 mb-6">{errorMessage}</p>
            {errorDetails && (
              <div className="bg-slate-950 p-4 rounded-lg overflow-auto text-xs text-slate-400 font-mono mb-6">
                <pre>{JSON.stringify(errorDetails, null, 2)}</pre>
              </div>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
