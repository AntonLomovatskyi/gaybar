/**
 * Cross-device sync via Firebase: Google sign-in + a single Firestore doc per user
 * (users/{uid}) holding the PersistedData JSON. On login we pull the cloud copy into the
 * store; local changes auto-push (debounced). All no-ops when Firebase isn't configured.
 */
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { create } from "zustand";
import { getSnapshot } from "@/data/backup";
import { useUserStore, type PersistedData } from "@/store/userStore";
import { auth, db, firebaseEnabled, googleProvider } from "./firebase";

export type SyncStatus = "idle" | "syncing" | "saved" | "error";

interface AuthState {
  user: User | null;
  status: SyncStatus;
  set: (p: Partial<Pick<AuthState, "user" | "status">>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  set: (p) => set(p),
}));

const setStatus = (status: SyncStatus) => useAuthStore.getState().set({ status });

let suppressPush = false; // don't echo a freshly-pulled snapshot back up
let pushTimer: ReturnType<typeof setTimeout> | undefined;

export async function pushNow(uid?: string): Promise<void> {
  const u = uid ?? useAuthStore.getState().user?.uid;
  if (!db || !u) return;
  try {
    setStatus("syncing");
    await setDoc(doc(db, "users", u), { data: getSnapshot(), updatedAt: Date.now() });
    setStatus("saved");
  } catch {
    setStatus("error");
  }
}

export async function pullNow(uid?: string): Promise<void> {
  const u = uid ?? useAuthStore.getState().user?.uid;
  if (!db || !u) return;
  try {
    setStatus("syncing");
    const snap = await getDoc(doc(db, "users", u));
    if (snap.exists()) {
      const data = snap.data().data as Partial<PersistedData> | undefined;
      if (data) {
        suppressPush = true;
        useUserStore.getState().importData(data);
        suppressPush = false;
      }
    } else {
      await pushNow(u); // first login on this account: seed the cloud with local data
    }
    setStatus("saved");
  } catch {
    setStatus("error");
  }
}

export async function signInWithGoogle(): Promise<void> {
  if (!auth) return;
  await signInWithPopup(auth, googleProvider);
}

export async function signOutNow(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

let started = false;
/** Wire the auth listener + debounced auto-push. Call once at app start. */
export function initSync(): void {
  if (started || !firebaseEnabled || !auth) return;
  started = true;

  onAuthStateChanged(auth, (user) => {
    useAuthStore.getState().set({ user });
    if (user) void pullNow(user.uid);
    else setStatus("idle");
  });

  useUserStore.subscribe(() => {
    if (suppressPush) return;
    const u = useAuthStore.getState().user;
    if (!u) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => void pushNow(u.uid), 1500);
  });
}
