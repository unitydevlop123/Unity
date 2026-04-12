
import React, { createContext, useContext, useState, useEffect } from 'react';
import { firebaseRest } from '../services/firebaseRest';
import { fetchSessionDetails, getDeviceType, getBrowserInfo, getOSInfo } from '../src/utils/sessionUtils';

interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  photoURL?: string;
  verified: boolean;
  pin?: string;
  squadCount?: number;
  bio?: string;
  location?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; verified?: boolean; profile?: any }>;
  finalizeLogin: (profile: any) => void;
  updateUser: (updates: Partial<User>) => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lazy initialization: Read from localStorage immediately on first render.
  // This prevents the "logout on refresh" issue by ensuring user is never null if data exists.
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('unitydev_auth_user');
      if (savedUser && savedUser !== 'undefined') {
        return JSON.parse(savedUser);
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      localStorage.removeItem('unitydev_auth_user');
    }
    return null;
  });

  // Since we read synchronously above, we don't need a loading state for the initial check.
  const [isLoading, setIsLoading] = useState(false);

  // Force loading to false after a short timeout to prevent stuck loading screen
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Save session and update location on login
  useEffect(() => {
    if (user) {
      const initSession = async () => {
        try {
          const ua = navigator.userAgent;
          const device = getDeviceType(ua);
          const browser = getBrowserInfo(ua);
          const os = getOSInfo(ua);
          
          const details = await fetchSessionDetails();
          const sessionData = {
            device,
            browser,
            os,
            ip: details.ip || "Unavailable",
            location: details.location || "Unknown",
            city: details.city || "Unknown",
            region: details.region || "Unknown",
            country: details.country || "Unknown",
            isp: details.isp || "Unknown Provider",
            lat: details.lat || 0,
            lon: details.lon || 0,
            timezone: details.timezone || "Unknown",
            isVpn: details.isVpn || false,
            isHosting: details.isHosting || false,
            continent: details.continent || "Unknown",
            calling_code: details.calling_code || "Unknown",
            flag_img: details.flag_img || "",
            flag_emoji: details.flag_emoji || "",
            org: details.org || "Unknown",
            vpnDetails: details.vpnDetails,
            hostingProvider: details.hostingProvider
          };

          await firebaseRest.saveSession(user.email, sessionData);

          // Update local user state with new location if it changed
          const newLocation = `${sessionData.location} ${sessionData.flag_emoji || ''}`.trim();
          if (user.location !== newLocation) {
            updateUser({ location: newLocation });
          }
        } catch (err) {
          console.error("Failed to save session:", err);
        }
      };
      
      initSession();
    }
  }, [user?.email]); // Only run when email changes (login)

  const login = async (email: string, password: string) => {
    try {
      // Add a 15-second timeout to the profile fetch to prevent hanging on "Checking..."
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 15000)
      );
      
      const profilePromise = firebaseRest.getUserProfile(email);
      
      const profile = await Promise.race([profilePromise, timeoutPromise]) as any;
      
      if (!profile) {
        return { success: false, message: 'Account not found. Please register.' };
      }

      if (profile.password !== password) {
        return { success: false, message: 'Invalid password. Please try again.' };
      }

      return { 
        success: true, 
        verified: profile.verified,
        profile: profile 
      };
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.message === 'TIMEOUT') {
        return { success: false, message: 'Connection timed out. Please check your internet and try again.' };
      }
      return { success: false, message: 'Login failed. Check your connection.' };
    }
  };

  const finalizeLogin = (profile: any) => {
    const authenticatedUser = { 
      id: profile.email, 
      email: profile.email, 
      name: profile.name,
      username: profile.username,
      photoURL: profile.photoURL,
      verified: true,
      squadCount: profile.squadCount || 0,
      bio: profile.bio,
      location: profile.location
    };
    setUser(authenticatedUser);
    localStorage.setItem('unitydev_auth_user', JSON.stringify(authenticatedUser));
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('unitydev_auth_user', JSON.stringify(updatedUser));
  };

  const register = async (email: string, password: string, name: string) => {
    // Registration doesn't set the user until verification is complete
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('unitydev_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, finalizeLogin, updateUser, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
