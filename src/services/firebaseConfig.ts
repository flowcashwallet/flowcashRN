import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJe8Qq8o6AtwmHI8uUk4Nsg09DWKnpHvQ",
  authDomain: "wallet-78ae4.firebaseapp.com",
  projectId: "wallet-78ae4",
  storageBucket: "wallet-78ae4.firebasestorage.app",
  messagingSenderId: "635821696580",
  appId: "1:635821696580:web:5fa9c16e8cba3c988cbe11",
  measurementId: "G-MHRW5V6R5L",
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app);
