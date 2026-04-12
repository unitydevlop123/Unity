import React, { createContext, useContext, useState } from 'react';
import { DEFAULT_MODEL_ID } from '@/lib/aiservice';

interface AgentContextValue {
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
}

const AgentContext = createContext<AgentContextValue>({
  selectedModelId: DEFAULT_MODEL_ID,
  setSelectedModelId: () => {},
});

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(
    () => localStorage.getItem('selectedModelId') ?? DEFAULT_MODEL_ID
  );

  const handleSet = (id: string) => {
    setSelectedModelId(id);
    localStorage.setItem('selectedModelId', id);
  };

  return (
    <AgentContext.Provider value={{ selectedModelId, setSelectedModelId: handleSet }}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => useContext(AgentContext);
