import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token and user data exist in localStorage
    const token = localStorage.getItem('philia_admin_token');
    const userData = localStorage.getItem('philia_admin_user');

    if (token && userData) {
      try {
        setAdmin(JSON.parse(userData));
      } catch (e) {
        console.error("Failed to parse admin user data", e);
      }
    }
    setLoading(false);
  }, []);

  const login = (token, adminData) => {
    localStorage.setItem('philia_admin_token', token);
    localStorage.setItem('philia_admin_user', JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem('philia_admin_token');
    localStorage.removeItem('philia_admin_user');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
