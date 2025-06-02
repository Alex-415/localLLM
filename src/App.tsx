import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Chat from './Chat';
import Login from './components/Login';
import './App.css';

const AppContent: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="app">
      {user ? (
        <>
          <div className="header">
            <h1>KML Production</h1>
            <div className="user-info">
              <span>Welcome, {user.email}</span>
              <button onClick={logout} className="logout-button">
                Logout
              </button>
            </div>
          </div>
          <Chat />
        </>
      ) : (
        <Login />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;