import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import provisionedConfig from "../firebase-applet-config.json";

// Paste your Firebase config here
const customFirebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  firestoreDatabaseId: "",
};

const hasCustomConfig = Boolean(
  customFirebaseConfig.apiKey &&
    customFirebaseConfig.authDomain &&
    customFirebaseConfig.projectId
);

const hasProvisionedConfig = Boolean(
  provisionedConfig &&
    provisionedConfig.apiKey &&
    provisionedConfig.authDomain &&
    provisionedConfig.projectId &&
    provisionedConfig.projectId !== "remixed-project-id"
);

export const isFirebaseConfigured = hasCustomConfig || hasProvisionedConfig;
export const isCustomConfigEmpty = !hasCustomConfig;

const activeConfig = hasCustomConfig ? customFirebaseConfig : provisionedConfig;

const app = isFirebaseConfigured ? initializeApp(activeConfig) : null;

export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const db = app
  ? activeConfig.firestoreDatabaseId
    ? getFirestore(app, activeConfig.firestoreDatabaseId)
    : getFirestore(app)
  : null;

export const OperationType = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  LIST: "list",
  GET: "get",
  WRITE: "write",
};

export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid ?? null,
      email: auth?.currentUser?.email ?? null,
      emailVerified: auth?.currentUser?.emailVerified ?? null,
      isAnonymous: auth?.currentUser?.isAnonymous ?? null,
      tenantId: auth?.currentUser?.tenantId ?? null,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
      console.error("Please check your Firebase configuration.");
    }
    return false;
  }
}
