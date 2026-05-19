import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/**
 * Firebase project switches on NEXT_PUBLIC_ENV.
 *
 *   NEXT_PUBLIC_ENV=sandbox  → mezan-app-sadnbox  (matches the mobile app's local/sandbox build)
 *   anything else / unset    → learn-trading-app  (production)
 *
 * For local development against the local mobile app + local compliance-check-api,
 * create `.env.local`:
 *   NEXT_PUBLIC_ENV=sandbox
 *   NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
 */

const sandboxConfig = {
  apiKey: "AIzaSyAjvnT_7nhYpjUDYxuWe9b_gaWpk3qr6Gc",
  authDomain: "mezan-app-sadnbox.firebaseapp.com",
  projectId: "mezan-app-sadnbox",
  storageBucket: "mezan-app-sadnbox.appspot.com",
  messagingSenderId: "862809107124",
  appId: "1:862809107124:web:c78d85b893aa199acd45e1",
};

const prodConfig = {
  apiKey: "AIzaSyCwFSva9l9asLDMouFTPaEjLzD8AvsykvU",
  authDomain: "learn-trading-app.firebaseapp.com",
  projectId: "learn-trading-app",
  storageBucket: "learn-trading-app.appspot.com",
  messagingSenderId: "223407081609",
  appId: "1:223407081609:web:cdc88b2f9022d23aa21e58",
};

const env = process.env.NEXT_PUBLIC_ENV || "prod";
const firebaseConfig = env === "sandbox" ? sandboxConfig : prodConfig;

if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log(
    `[firebase] env=${env} → projectId=${firebaseConfig.projectId}`,
  );
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { auth };
