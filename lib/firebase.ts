
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQq1cCKVZ21v-JytpksNL_EKIWWMTkNkI",
  authDomain: "subdomxtop.firebaseapp.com",
  projectId: "subdomxtop",
  storageBucket: "subdomxtop.firebasestorage.app",
  messagingSenderId: "1062123174096",
  appId: "1:1062123174096:web:25d12c8e0279881102c6d5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
