import { createContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/auth.service.js';

const STORAGE_TOKEN = 'ascendiq-token';

export const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  verifyOTP: async () => {},
  googleLogin: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = window.localStorage.getItem(STORAGE_TOKEN);
    if (savedToken) {
      setToken(savedToken);
      authService.setToken(savedToken);
      authService.getCurrentUser().then((data) => {
        setUser(data.user || null);
        setLoading(false);
      }).catch(() => {
        setUser(null);
        setToken(null);
        window.localStorage.removeItem(STORAGE_TOKEN);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    const authToken = response.token;
    const authUser = response.user;
    if (!authToken) {
      throw new Error('Login did not return an authentication token.');
    }
    setToken(authToken);
    setUser(authUser);
    window.localStorage.setItem(STORAGE_TOKEN, authToken);
    authService.setToken(authToken);
    return response;
  };

  const register = async (details) => {
    const response = await authService.register(details);
    const authToken = response.token;
    const authUser = response.user;
    if (authToken) {
      setUser(authUser);
      setToken(authToken);
      window.localStorage.setItem(STORAGE_TOKEN, authToken);
      authService.setToken(authToken);
    } else {
      setUser(null);
      setToken(null);
      window.localStorage.removeItem(STORAGE_TOKEN);
      authService.clearToken();
    }
    return response;
  };

  const googleLogin = async (idToken) => {
    const response = await authService.googleLogin(idToken);
    const authToken = response.token;
    const authUser = response.user;
    if (!authToken) {
      throw new Error('Google login did not return an authentication token.');
    }
    setToken(authToken);
    setUser(authUser);
    window.localStorage.setItem(STORAGE_TOKEN, authToken);
    authService.setToken(authToken);
    return response;
  };

  const verifyOTP = async ({ email, otp }) => {
    const response = await authService.verifyOTP(email, otp);
    const authToken = response.token;
    const authUser = response.user;
    if (!authToken) {
      throw new Error('OTP verification did not return an authentication token.');
    }
    setToken(authToken);
    setUser(authUser);
    window.localStorage.setItem(STORAGE_TOKEN, authToken);
    authService.setToken(authToken);
    return response;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem(STORAGE_TOKEN);
    authService.clearToken();
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, verifyOTP, googleLogin, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
