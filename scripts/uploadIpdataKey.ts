import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

const firebaseConfig = {
  databaseURL: "https://unitydeva-ai-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const IPDATA_KEY = "9a29c332d65692d2e6a2d9f0e1028df7158777006f77b366a57cedc0";

async function uploadIpdataKey() {
  try {
    console.log("Uploading ipdata.co API Key to Firebase...");
    await set(ref(db, 'api-keys/ipdata'), {
      key: IPDATA_KEY,
      active: true,
      updatedAt: new Date().toISOString()
    });
    console.log("✅ ipdata.co API Key saved successfully to /api-keys/ipdata");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to upload key:", error);
    process.exit(1);
  }
}

uploadIpdataKey();
