import React, { createContext, useContext, useState } from 'react';

interface VerificationState {
  email: string;
  name: string;
  code: string;
  expiresAt: number;
}

interface VerificationContextType {
  verificationData: VerificationState | null;
  setVerification: (email: string, name: string, code: string) => void;
  clearVerification: () => void;
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

export const VerificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [verificationData, setVerificationData] = useState<VerificationState | null>(null);

  const setVerification = (email: string, name: string, code: string) => {
    setVerificationData({
      email,
      name,
      code,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes from now
    });
  };

  const clearVerification = () => {
    setVerificationData(null);
  };

  return (
    <VerificationContext.Provider value={{ verificationData, setVerification, clearVerification }}>
      {children}
    </VerificationContext.Provider>
  );
};

export const useVerification = () => {
  const context = useContext(VerificationContext);
  if (!context) throw new Error('useVerification must be used within VerificationProvider');
  return context;
};