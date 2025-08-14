import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the user is logged in on page refresh
    const storedUser = localStorage.getItem('user');
    const sessionExpiry = localStorage.getItem('sessionExpiry');
    
    // Check if session has expired (24 hours)
    if (storedUser && sessionExpiry) {
      const expiryTime = parseInt(sessionExpiry);
      const currentTime = Date.now();
      
      if (currentTime > expiryTime) {
        // Session expired, clear everything
        localStorage.removeItem('user');
        localStorage.removeItem('sessionExpiry');
        localStorage.removeItem('chat_session_id');
        setIsLoggedIn(false);
        setUserName('');
        setUserId(null);
      } else {
        try {
          const user = JSON.parse(storedUser);
          setIsLoggedIn(true);
          setUserName(user.name || '');
          setUserId(user.id || null);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          // Clear invalid data
          localStorage.removeItem('user');
          localStorage.removeItem('sessionExpiry');
          localStorage.removeItem('chat_session_id');
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    // Set session expiry to 24 hours from now
    const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('sessionExpiry', expiryTime.toString());
    setIsLoggedIn(true);
    setUserName(userData.name || '');
    setUserId(userData.id || null);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('sessionExpiry');
    localStorage.removeItem('chat_session_id');
    setIsLoggedIn(false);
    setUserName('');
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      userName, 
      userId,
      isLoading,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 