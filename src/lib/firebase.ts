import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCwFSva9l9asLDMouFTPaEjLzD8AvsykvU",
  authDomain: "learn-trading-app.firebaseapp.com",
  projectId: "learn-trading-app",
  storageBucket: "learn-trading-app.appspot.com",
  messagingSenderId: "223407081609",
  appId: "1:223407081609:web:cdc88b2f9022d23aa21e58",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { auth };
