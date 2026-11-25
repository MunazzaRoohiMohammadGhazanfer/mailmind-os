import type { Auth, GoogleAuthProvider } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

export const isFirebaseConfigured: boolean;
export const isCustomConfigEmpty: boolean;
export const auth: Auth | null;
export const googleProvider: GoogleAuthProvider;
export const db: Firestore | null;

export const OperationType: {
  readonly CREATE: "create";
  readonly UPDATE: "update";
  readonly DELETE: "delete";
  readonly LIST: "list";
  readonly GET: "get";
  readonly WRITE: "write";
};

export function handleFirestoreError(
  error: unknown,
  operationType: string,
  path: string | null
): never;

export function testConnection(): Promise<boolean>;
