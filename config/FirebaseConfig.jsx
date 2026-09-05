import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDlhB0Z1beZ4nln3AM0zlwufs16A5eFanc",
  authDomain: "clientkeeper-f060e.firebaseapp.com",
  projectId: "clientkeeper-f060e",
  storageBucket: "clientkeeper-f060e.firebasestorage.app",
  messagingSenderId: "540746776065",
  appId: "1:540746776065:web:c3d73c11b21400b738ca00",
  measurementId: "G-6Z6K2H2HQ6",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
