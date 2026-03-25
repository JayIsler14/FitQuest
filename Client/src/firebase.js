import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDMB8fr73wcFB-CElKvcoppqcC4I4tsMc0",
  authDomain: "fitquest-b2735.firebaseapp.com",
  projectId: "fitquest-b2735",
  storageBucket: "fitquest-b2735.firebasestorage.app",
  messagingSenderId: "143485863899",
  appId: "1:143485863899:web:f2e19cec17a73cc36989fe"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);