const FIREBASE_URL = 'https://unitydeva-ai-default-rtdb.firebaseio.com';
const CHAT_KEY = "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";

const upload = async () => {
  await fetch(`${FIREBASE_URL}/api-keys/chat.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      active: true,
      key: CHAT_KEY,
      updated_at: new Date().toISOString()
    })
  });
  console.log(`Uploaded chat key`);
};
upload();
