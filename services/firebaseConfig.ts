import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  databaseURL: 'https://unitydeva-ai-default-rtdb.firebaseio.com',
  storageBucket: 'unitydeva-ai.appspot.com'
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);
