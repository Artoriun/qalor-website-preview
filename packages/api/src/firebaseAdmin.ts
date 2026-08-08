import { cert, initializeApp } from 'firebase-admin/app';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';
import { createMemoryStore } from './testing/memoryStore';

/**
 * Firestore, or a stand-in that works when it is not configured.
 *
 * `admin.credential.cert()` throws on a missing project_id, so initialising unconditionally
 * would mean the whole API refuses to boot on a fresh clone or without real credentials.
 *
 * Unlike the "reject everything" stub this is modeled on (see the sibling
 * turbo-portfolio-starter project, which deliberately fails writes so a real deployment
 * can't silently no-op), this one falls back to an in-memory store that actually works —
 * per explicit instruction, this repo is meant to be usable end to end with local
 * placeholders before real Firestore credentials exist. It resets on every restart and
 * every write is a stopgap, not a "you can skip setting up Firestore" invitation — see the
 * startup warning in index.ts.
 */
const configured = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

/** Shaped like the slice of the Firestore API this project actually uses. */
export type Store = Pick<Firestore, 'collection'>;

export const isFirestoreConfigured = configured;

const real: Store = configured
  ? getFirestore(
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      }),
    )
  : (createMemoryStore() as unknown as Store);

let override: Store | null = null;

/**
 * Swaps the store every route sees, for tests. One switch rather than an injection point
 * per module: `db` is imported as a binding all over the API, so reassigning it would not
 * reach the modules that already hold it — the proxy below forwards each access instead,
 * which means a swap applies everywhere immediately.
 *
 * Pass null to restore. Nothing in the running app calls this outside tests.
 */
export function setStore(store: Store | null): void {
  override = store;
}

export const db: Store = new Proxy({} as Store, {
  get: (_target, prop: string | symbol) => (override ?? real)[prop as keyof Store],
});
