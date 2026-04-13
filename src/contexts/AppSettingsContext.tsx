import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AppSettings {
  splitBrainMode: boolean;
  memoryMapEnabled: boolean;
  ghostSuggestionsEnabled: boolean;
  // ── New Functionality ─────────────────────────────────
  echoRepliesEnabled: boolean;       // AI mirrors writing style
  ghostModeEnabled: boolean;         // Hidden answers with emoji hints
  splitPersonalityEnabled: boolean;  // Two-character debate + judge
  silenceBreakerEnabled: boolean;    // Detects typing hesitation
}

const DEFAULT_SETTINGS: AppSettings = {
  splitBrainMode: false,
  memoryMapEnabled: false,
  ghostSuggestionsEnabled: true,
  // New Functionality — all OFF by default
  echoRepliesEnabled: false,
  ghostModeEnabled: false,
  splitPersonalityEnabled: false,
  silenceBreakerEnabled: false,
};

interface AppSettingsContextValue {
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  setSetting: () => {},
});

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('unitydev_app_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem('unitydev_app_settings', JSON.stringify(settings));
  }, [settings]);

  const setSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AppSettingsContext.Provider value={{ settings, setSetting }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => useContext(AppSettingsContext);
