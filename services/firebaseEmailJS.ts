// services/firebaseEmailJS.ts - ONLY THIS FILE, NOTHING ELSE

const FIREBASE_URL = 'https://unitydeva-ai-default-rtdb.firebaseio.com';

/**
 * Tests Firebase connectivity. 
 * If this returns null or an error, ensure your Firebase Database Rules are set to:
 * { 
 *   "rules": { 
 *     ".read": true, 
 *     ".write": true 
 *   } 
 * }
 */
export const testFirebaseConnection = async () => {
  const res = await fetch(`${FIREBASE_URL}/test.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ working: true })
  });
  return res.json();
};

/**
 * Saves EmailJS credentials to the Firebase Realtime Database.
 */
export const saveEmailJSCredentials = async () => {
  const data = {
    service_id: "service_nlo3bjv",
    template_id: "template_11b3aep",
    public_key: "ZVf9C3t85A|1",
    private_key: "nOj-fOaK-ht3OkfpYDyOd",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const res = await fetch(`${FIREBASE_URL}/api-keys/emailjs.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  return res.json();
};

/**
 * Retrieves EmailJS credentials from the Firebase Realtime Database.
 */
export const getEmailJSCredentials = async () => {
  const res = await fetch(`${FIREBASE_URL}/api-keys/emailjs.json`);
  return res.json();
};
