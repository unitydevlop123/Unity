const FIREBASE_DB_URL = 'https://unitydeva-ai-default-rtdb.firebaseio.com';

let groqApiKeys: string[] = [];
let currentKeyIndex = 0;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchGroqApiKeys = async (): Promise<string[]> => {
  const now = Date.now();
  if (groqApiKeys.length > 0 && now - lastFetchTime < CACHE_DURATION) {
    return groqApiKeys;
  }

  const keys: string[] = [];

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const res = await fetch(`${FIREBASE_DB_URL}/api-keys/groq.json`, { signal: controller.signal });
    clearTimeout(id);
    
    if (res.ok) {
      const data = await res.json();
      
      // Check root level key
      if (data?.key && typeof data.key === 'string') {
        if (data.active === true || data.active === 'true') {
          if (!keys.includes(data.key)) keys.push(data.key);
        }
      }
      
      // Check nested keys (key1, key2, etc.)
      if (data && typeof data === 'object') {
        for (const keyId in data) {
          if (keyId === 'key' || keyId === 'active' || keyId === 'status' || keyId === 'updated_at') continue;
          
          const keyData = data[keyId];
          if (keyData && typeof keyData === 'object') {
            if (keyData.active && keyData.key && typeof keyData.key === 'string' && keyData.key.length > 10) {
              if (!keys.includes(keyData.key)) keys.push(keyData.key);
            }
          }
        }
      }
    } else {
      console.warn(`Firebase returned status ${res.status}`);
    }
  } catch (error) {
    console.warn('Firebase connection failed', error);
  }

  // Always include the local env key as a fallback/additional key
  const envKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GROQ_API_KEY : null;
  if (envKey && !keys.includes(envKey)) {
    keys.push(envKey);
  }

  if (keys.length > 0) {
    groqApiKeys = keys;
    lastFetchTime = now;
  }
  
  return keys;
};

export const getNextGroqApiKey = async (): Promise<string> => {
  const keys = await fetchGroqApiKeys();
  
  if (keys.length === 0) {
    throw new Error("No API keys available");
  }
  
  const key = keys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
};
