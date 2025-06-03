import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();

  useEffect(() => {
    console.log('Login component mounted, current user:', user);
    // Redirect if user is already logged in
    if (user) {
      console.log('User is logged in, redirecting to home');
      navigate('/');
    }
  }, [user, navigate]);

  const getErrorMessage = (error: any): string => {
    console.log('Processing error:', error);
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing the sign-in.';
      case 'auth/cancelled-popup-request':
        return 'Multiple popup requests were made. Please try again.';
      case 'auth/popup-blocked':
        return 'The popup was blocked by the browser. Please allow popups for this site.';
      case 'auth/network-request-failed':
        return 'Network error occurred. Please check your internet connection.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized for Firebase authentication.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log('Starting Google sign in process...');
      setIsLoading(true);
      setError(null);
      
      await signInWithGoogle();
      console.log('Google sign in successful, redirecting...');
      navigate('/');
    } catch (error: any) {
      console.error('Error during Google sign in:', error);
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#343541'
    }}>
      <div className="login-box" style={{
        backgroundColor: '#444654',
        padding: '2.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '480px',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          color: '#FFFFFF', 
          marginBottom: '2.5rem', 
          textAlign: 'center',
          fontSize: '2rem',
          fontWeight: '600'
        }}>
          KML Production
        </h2>
        
        {error && (
          <div style={{
            backgroundColor: '#da3633',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          className="google-signin-button"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '0.875rem',
            backgroundColor: '#FFFFFF',
            color: '#000000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google" 
            style={{ width: '20px', height: '20px' }}
          />
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <p style={{ 
          marginTop: '2rem', 
          color: '#C5C5D2',
          fontSize: '0.95rem',
          lineHeight: '1.5'
        }}>
          Sign in with your Google account to access KML Production
        </p>
      </div>
    </div>
  );
};

export default Login; 