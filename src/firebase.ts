import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigRaw from '../firebase-applet-config.json';

const firebaseConfig = { ...firebaseConfigRaw, apiKey: atob("QUl6YVN5QW51QTUtQWhxRlFBYmZTZ1AxRl9zWTllb004aTdCWk5N") };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

