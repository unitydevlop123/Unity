
// scripts/setupFirebase.ts
// RUN THIS ONCE TO SETUP ENTIRE FIREBASE DATABASE WITH READABLE FOLDERS

const FIREBASE_URL = 'https://unitydeva-ai-default-rtdb.firebaseio.com';

const encodeEmail = (email: string): string => {
  return email
    .toLowerCase()
    .replace(/@/g, '_at_')
    .replace(/\./g, '_dot_');
};

const setupFirebase = async () => {
  console.log('🚀 Starting Firebase setup with READABLE folder names...');
  
  const demoEmail = 'unityodigie65@gmail.com';
  const readableKey = encodeEmail(demoEmail); // unityodigie65_at_gmail_dot_com
  const legacyBase64Key = btoa(demoEmail);

  try {
    // 1. CLEANUP: Delete legacy Base64 folders
    console.log(`🧹 Deleting legacy Base64 folder: /users/${legacyBase64Key}`);
    await fetch(`${FIREBASE_URL}/users/${legacyBase64Key}.json`, { method: 'DELETE' });

    // 2. CREATE READABLE USERS FOLDER & PROFILE
    console.log(`👤 Creating readable profile at /users/${readableKey}/profile.json`);
    await fetch(`${FIREBASE_URL}/users/${readableKey}/profile.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: demoEmail,
        name: 'UnityDev Demo User',
        password: 'demo123456',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        verified: true,
        provider: 'email'
      })
    });

    // 3. CREATE SETTINGS
    console.log(`⚙️ Creating settings at /users/${readableKey}/settings.json`);
    await fetch(`${FIREBASE_URL}/users/${readableKey}/settings.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        darkMode: true,
        selectedModel: 'llama-3.3-70b-versatile',
        language: 'English',
        notifications: true
      })
    });

    // 4. CREATE CONVERSATIONS FOLDER
    console.log(`📁 Initializing conversations at /users/${readableKey}/conversations/placeholder.json`);
    await fetch(`${FIREBASE_URL}/users/${readableKey}/conversations/placeholder.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _: 'folder created' })
    });

    // 5. INITIALIZE GROQ API KEY
    console.log(`🔑 Initializing Groq API Key at /api-keys/groq.json`);
    // NOTE: Sending 'active' as a strict boolean true
    const keyResponse = await fetch(`${FIREBASE_URL}/api-keys/groq.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        active: true, 
        key: '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',
        updated_at: new Date().toISOString()
      })
    });

    if (keyResponse.ok) {
        console.log('✅ API Key saved successfully with correct BOOLEAN type');
    } else {
        console.error('❌ Failed to save API key');
    }

    console.log('🎉 SETUP COMPLETE WITH READABLE FOLDERS!');
    console.log('🔗 Check data here:', `${FIREBASE_URL}/users/${readableKey}.json`);
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
};

// Run it
setupFirebase();

export {};
