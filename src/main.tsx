import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App";
import "./index.css";
import "./App.css";
import "./Chat.css";

// Error Fallback Component
const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="error-container">
    <h2>Something went wrong:</h2>
    <pre>{error.message}</pre>
  </div>
);

// Create a wrapper component to handle API routes
const AppWrapper: React.FC = () => {
  const location = useLocation();

  // If the path starts with /api/, don't render the app
  if (location.pathname.startsWith('/api/')) {
    return null;
  }

  return <App />;
};

// Add proper error boundaries
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error!} />;
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppWrapper />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);