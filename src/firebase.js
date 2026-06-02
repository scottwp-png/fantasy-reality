import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, set, update, remove, onValue, push, serverTimestamp, query, limitToLast } from 'firebase/database'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDKmOEL0eT0YL47wBz24RYChyWIPUv00OM",
  authDomain: "fantasy-reality-d7e16.firebaseapp.com",
  databaseURL: "https://fantasy-reality-d7e16-default-rtdb.firebaseio.com",
  projectId: "fantasy-reality-d7e16",
  storageBucket: "fantasy-reality-d7e16.firebasestorage.app",
  messagingSenderId: "897295939521",
  appId: "1:897295939521:web:c1a6fa044e2dd86745e140"
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

export const ADMIN_EMAIL = "scottwpii@gmail.com"

// ─── Auth Functions ───
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

export async function signUp(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  if (displayName) await updateProfile(cred.user, { displayName })
  return cred.user
}

export async function signIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

export async function signOut() {
  await firebaseSignOut(auth)
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email)
}

// ─── Database Functions ───
export async function loadData(key, fallback) {
  try { const snap = await get(ref(db, "frtv/" + key)); const val = snap.val(); return val !== null ? val : fallback } catch { return fallback }
}
export async function saveData(key, value) {
  try { await set(ref(db, "frtv/" + key), value) } catch (e) { console.error("Firebase save error:", e) }
}
export async function deleteData(key) {
  try { await remove(ref(db, "frtv/" + key)) } catch (e) {}
}

// v2.6.9.0: root-level helpers for admin-shared collections that live OUTSIDE
// the app-namespace `frtv/` path — scoringRuleLibrary, showScoring, showCast.
// These paths have their OWN rule blocks in database.rules.json (admin-write,
// all-auth-read), separate from `frtv/`. The plain `loadData`/`saveData`
// helpers prefix `frtv/` and so can't reach these paths.
export async function loadRootData(key, fallback) {
  try { const snap = await get(ref(db, key)); const val = snap.val(); return val !== null ? val : fallback } catch { return fallback }
}
export async function saveRootData(key, value) {
  try { await set(ref(db, key), value) } catch (e) { console.error("Firebase saveRootData error:", e); throw e; }
}
export async function loadAllLeagues() {
  try { const index = await loadData("league_index", []); const leagues = []; for (const id of index) { const league = await loadData("league_" + id, null); if (league) leagues.push(league); } return leagues } catch { return [] }
}
export async function saveAllLeagues(leagues) {
  const index = leagues.map(l => l.id); await saveData("league_index", index); for (const league of leagues) { await saveData("league_" + league.id, league); }
}
// v2.6.23.2: live-sync subscription for a single league. Caller passes the
// league id + a callback; we attach an onValue listener at the league's
// RTDB path. The listener fires once immediately with the current snapshot,
// then again on every server-confirmed write (including the caller's own).
// Returns an unsubscribe function — caller MUST call it on unmount / when
// switching leagues, or the listener leaks and double-fires for the next
// league. Idempotent: re-firing with identical data just reassigns the same
// object; React's setState with equal value is a no-op for primitive
// equality, otherwise re-renders happen but read identical UI.
export function subscribeLeague(leagueId, callback) {
  const r = ref(db, "frtv/league_" + leagueId);
  return onValue(r, (snap) => callback(snap.val()));
}

// v2.6.24.0: league chat. Messages live at `frtv/league_<id>_chat/<auto-id>`
// — a SIBLING of the league doc, not a child, so saveLeague's full-doc
// update() doesn't blow them away. The chat path matches the existing
// `$league_key` wildcard rule (any league_* child of frtv), so no rules
// deploy required.
//
// Each message is `{ uid, authorName, text, createdAt }` with createdAt
// pulled from `serverTimestamp()` so the order across clients is consistent
// even when their local clocks drift.
//
// subscribeLeagueChat returns the unsubscribe handle; caller must invoke
// it when the chat view unmounts. The query is limited to the last 200
// messages so the payload stays small as a league piles up history.
export function subscribeLeagueChat(leagueId, callback) {
  const q = query(ref(db, "frtv/league_" + leagueId + "_chat"), limitToLast(200));
  return onValue(q, (snap) => {
    const val = snap.val() || {};
    const list = Object.entries(val).map(([id, m]) => ({ id, ...m })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    callback(list);
  });
}

export async function sendChatMessage(leagueId, { uid, authorName, text }) {
  if (!uid || !text?.trim()) return;
  const r = ref(db, "frtv/league_" + leagueId + "_chat");
  await push(r, { uid, authorName: authorName || "Player", text: text.trim(), createdAt: serverTimestamp() });
}

export async function deleteChatMessage(leagueId, messageId) {
  await remove(ref(db, "frtv/league_" + leagueId + "_chat/" + messageId));
}

// Saves a single league by path — avoids the race condition where saveAllLeagues
// replaces the entire league object, causing concurrent edits to overwrite each other.
// Use this for all in-session league updates (scoring, roster changes, settings, etc.)
// Only use saveAllLeagues for bulk operations (import, initial seed).
export async function saveLeague(league) {
  try {
    await update(ref(db, "frtv"), { ["league_" + league.id]: league });
  } catch (e) {
    console.error("Firebase saveLeague error:", e);
    throw e;
  }
}
export async function clearAllStorage() {
  try { const index = await loadData("league_index", []); for (const id of index) { await deleteData("league_" + id); } await deleteData("league_index"); await deleteData("users"); } catch (e) { console.error("Clear error:", e) }
}

// ─── User Profiles (links Firebase Auth uid to league teams) ───
export async function loadUserProfile(uid) {
  try { const snap = await get(ref(db, "frtv_users/" + uid)); return snap.val() } catch { return null }
}
export async function saveUserProfile(uid, profile) {
  try { await set(ref(db, "frtv_users/" + uid), profile) } catch (e) { console.error("Save profile error:", e); throw e; }
}
export async function loadAllUserProfiles() {
  try { const snap = await get(ref(db, "frtv_users")); return snap.val() || {} } catch { return {} }
}

// ─── Delete Account Helpers ───
export async function deleteUserProfile(uid) {
  try { await remove(ref(db, "frtv_users/" + uid)) } catch (e) { console.error("Delete profile error:", e) }
}

export async function deleteAuthAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error("No user signed in");
  const { deleteUser } = await import('firebase/auth');
  await deleteUser(user);
}
