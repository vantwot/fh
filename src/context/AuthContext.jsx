import { createContext, useContext, useState } from 'react';
import { getFromStorage, saveToStorage, removeFromStorage } from '../utils/storage';
import { api } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getFromStorage('auth_user', null));

  const login = async (username, password) => {
    try {
      const userData = await api.login(username, password);
      setUser(userData);
      saveToStorage('auth_user', userData);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    removeFromStorage('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
