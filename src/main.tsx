import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App";
import "./index.css";
import "./App.css";
import "./Chat.css";

// Create a wrapper component to handle API routes
const AppWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // If the path starts with /api/, don't render the app
  if (location.pathname.startsWith('/api/')) {
    return null;
  }

  return <App />;
};

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppWrapper />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);