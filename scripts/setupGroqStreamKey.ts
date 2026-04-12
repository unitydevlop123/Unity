// scripts/setupGroqStreamKey.ts
const FIREBASE_URL = 'https://unitydeva-ai-default-rtdb.firebaseio.com';

const setupGroqStreamKey = async () => {
  console.log('🚀 Starting Groq Stream API Key setup...');
  
  try {
    const keyResponse = await fetch(`${FIREBASE_URL}/api-keys/groq-stream.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        active: true, 
        key: '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',
        updated_at: new Date().toISOString()
      })
    });

    if (keyResponse.ok) {
        console.log('✅ Stream API Key saved successfully to /api-keys/groq-stream.json');
    } else {
        console.error('❌ Failed to save Stream API key');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
};

setupGroqStreamKey();

export {};
