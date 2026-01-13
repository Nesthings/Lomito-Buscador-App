import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aquí irá la lógica de autenticación con Firebase
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const login = async () => {
    try {
      // Lógica de login con Google
      console.log('Login');
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Lógica de logout
      setUser(null);
      console.log('Logout');
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};