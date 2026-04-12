const FIREBASE_URL = 'https://unitydeva-ai-default-rtdb.firebaseio.com';

const keys = [
  "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",
  "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",
  "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",
  "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",
  "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",
  "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",
  "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",
  "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",
  "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",
  "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",
  "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"
];

const upload = async () => {
  for (let i = 0; i < keys.length; i++) {
    const keyNum = i + 1;
    await fetch(`${FIREBASE_URL}/api-keys/groq/key${keyNum}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        active: true,
        key: keys[i],
        updated_at: new Date().toISOString()
      })
    });
    console.log(`Uploaded key${keyNum}`);
  }
};
upload();
