import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on mount
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);

    // Listen for storage changes (login/logout from other tabs)
    const handleStorage = (e) => {
      if (e.key === 'user') {
        if (e.newValue) {
          setUser(JSON.parse(e.newValue));
        } else {
          setUser(null);
        }
      }
    };

    // Listen for custom userChanged event
    const handleUserChanged = () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('userChanged', handleUserChanged);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('userChanged', handleUserChanged);
    };
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
    window.dispatchEvent(new Event('userChanged'));
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    window.dispatchEvent(new Event('userChanged'));
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
