import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, set, remove } from 'firebase/database'

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

export async function loadData(key, fallback) {
  try {
    const snap = await get(ref(db, "frtv/" + key))
    const val = snap.val()
    return val !== null ? val : fallback
  } catch { return fallback }
}

export async function saveData(key, value) {
  try { await set(ref(db, "frtv/" + key), value) }
  catch (e) { console.error("Firebase save error:", e) }
}

export async function deleteData(key) {
  try { await remove(ref(db, "frtv/" + key)) }
  catch (e) {}
}

export async function loadAllLeagues() {
  try {
    const index = await loadData("league_index", [])
    const leagues = []
    for (const id of index) {
      const league = await loadData("league_" + id, null)
      if (league) leagues.push(league)
    }
    return leagues
  } catch { return [] }
}

export async function saveAllLeagues(leagues) {
  const index = leagues.map(l => l.id)
  await saveData("league_index", index)
  for (const league of leagues) {
    await saveData("league_" + league.id, league)
  }
}

export async function clearAllStorage() {
  try {
    const index = await loadData("league_index", [])
    for (const id of index) { await deleteData("league_" + id) }
    await deleteData("league_index")
    await deleteData("leagues")
    await deleteData("users")
  } catch (e) { console.error("Clear error:", e) }
}

export async function fbLoadShared(key) {
  try {
    const snap = await get(ref(db, "frtv_shared/" + key))
    return snap.val()
  } catch { return null }
}

export async function fbSaveShared(key, value) {
  try { await set(ref(db, "frtv_shared/" + key), value) } catch {}
}

export async function fbDeleteShared(key) {
  try { await remove(ref(db, "frtv_shared/" + key)) } catch {}
}
