import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyArKpR-6RaQC2fblRKqZHlAeyr1axAYk7g",
  authDomain: "gam-aom-todo-app.firebaseapp.com",
  projectId: "gam-aom-todo-app",
  storageBucket: "gam-aom-todo-app.firebasestorage.app",
  messagingSenderId: "667516518774",
  appId: "1:667516518774:web:5492aeb583bb3cc28aba57",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
