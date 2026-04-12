
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

const firebaseConfig = {
  databaseURL: "https://unitydeva-ai-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const API_KEY = "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";

async function saveKey() {
  try {
    console.log("Saving Stream Support API Key to Firebase...");
    await set(ref(db, 'api-keys/stream-support-api'), {
      key: API_KEY,
      active: true,
      updatedAt: new Date().toISOString()
    });
    console.log("✅ API Key saved successfully to /api-keys/stream-support-api");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to save key:", error);
    process.exit(1);
  }
}

saveKey();
