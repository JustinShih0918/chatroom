// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC7pm2-6D9vnhKrOuas0rq-4bIo4HtgBAc",
    authDomain: "chatroom-7b293.firebaseapp.com",
    projectId: "chatroom-7b293",
    storageBucket: "chatroom-7b293.firebasestorage.app",
    messagingSenderId: "1063092839923",
    appId: "1:1063092839923:web:14cf0aa52f82b0bdca9e86",
    databaseURL: "https://chatroom-7b293-default-rtdb.firebaseio.com"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase();
export const storage = getStorage();
