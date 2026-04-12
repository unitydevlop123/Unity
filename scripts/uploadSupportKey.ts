
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

const firebaseConfig = {
  databaseURL: "https://unitydeva-ai-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const SUPPORT_KEY = "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";

async function uploadSupportKey() {
  try {
    console.log("Uploading Support API Key to Firebase...");
    await set(ref(db, 'api-keys/stream-support-api'), {
      key: SUPPORT_KEY,
      active: true,
      model: "gemma2-9b-it",
      updatedAt: new Date().toISOString()
    });
    console.log("✅ Support API Key saved successfully to /api-keys/stream-support-api");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to upload key:", error);
    process.exit(1);
  }
}

uploadSupportKey();
