/**
 * In-memory stand-in for the slice of Firestore this project uses.
 *
 * Two jobs: the seam tests swap in to exercise routes without a real Firestore, and — since
 * this repo is meant to run end to end on local placeholders before real credentials exist
 * — the automatic fallback `firebaseAdmin.ts` reaches for when FIREBASE_* is unset. Small
 * enough to read in one go, which matters for the first job: a stand-in that quietly
 * behaves unlike the real thing turns a passing test into a false negative. Models exactly
 * what the routes depend on — `exists` false for an unwritten doc, `.set(data, {merge:true})`
 * merging rather than replacing, a collection `.get()` listing every doc with `.id`/`.data()`
 * — and nothing else.
 */
export interface MemoryDoc {
  exists: boolean;
  id: string;
  data(): Record<string, unknown> | undefined;
}

export interface MemorySnapshot {
  docs: MemoryDoc[];
  forEach(fn: (doc: MemoryDoc) => void): void;
}

export interface MemoryStore {
  collection(name: string): {
    doc(id: string): {
      get(): Promise<MemoryDoc>;
      set(value: Record<string, unknown>, opts?: { merge?: boolean }): Promise<unknown>;
      delete(): Promise<unknown>;
    };
    get(): Promise<MemorySnapshot>;
  };
  /** Every document, for asserting on what was written in tests. */
  dump(): Record<string, Record<string, unknown>>;
  /** Makes every operation reject, to exercise the fail-open paths. */
  breakWith(message: string): void;
}

export function createMemoryStore(): MemoryStore {
  const docs = new Map<string, Record<string, unknown>>();
  let broken: string | null = null;

  const fail = () => {
    if (broken) throw new Error(broken);
  };

  return {
    collection(name: string) {
      return {
        doc(id: string) {
          const key = `${name}/${id}`;
          return {
            async get(): Promise<MemoryDoc> {
              fail();
              const value = docs.get(key);
              return { exists: value !== undefined, id, data: () => value };
            },
            async set(value: Record<string, unknown>, opts?: { merge?: boolean }) {
              fail();
              const existing = opts?.merge ? (docs.get(key) ?? {}) : {};
              docs.set(key, { ...existing, ...value });
              return undefined;
            },
            async delete() {
              fail();
              docs.delete(key);
              return undefined;
            },
          };
        },
        async get(): Promise<MemorySnapshot> {
          fail();
          const prefix = `${name}/`;
          const found: MemoryDoc[] = [];
          for (const [key, value] of docs) {
            if (!key.startsWith(prefix)) continue;
            const id = key.slice(prefix.length);
            found.push({ exists: true, id, data: () => value });
          }
          return { docs: found, forEach: (fn) => found.forEach(fn) };
        },
      };
    },
    dump: () => Object.fromEntries(docs),
    breakWith(message: string) {
      broken = message;
    },
  };
}
