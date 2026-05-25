import { db } from "./config";
import { doc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { Trap, Room } from "@/types/trap";

// --- グッズ(Trap)データの保存ロジック ---
export const saveTrapData = async (trap: Trap, userId: string | null) => {
  if (!userId) {
    // 【ゲストモード】LocalStorageに保存
    const localTraps = localStorage.getItem("bug_guard_traps");
    const traps: Trap[] = localTraps ? JSON.parse(localTraps) : [];
    const index = traps.findIndex((t) => t.id === trap.id);
    if (index >= 0) {
      traps[index] = trap;
    } else {
      traps.push(trap);
    }
    localStorage.setItem("bug_guard_traps", JSON.stringify(traps));
  } else {
    // 【ログインモード】Firestoreに同期
    const updatedTrap = { ...trap, userId };
    await setDoc(doc(db, "traps", trap.id), updatedTrap);
  }
};

// --- データの移行（ゲストからアカウント連携時） ---
export const migrateLocalDataToFirebase = async (userId: string) => {
  const localTraps = localStorage.getItem("bug_guard_traps");
  if (!localTraps) return;

  const traps: Trap[] = JSON.parse(localTraps);
  for (const trap of traps) {
    await saveTrapData(trap, userId);
  }
  localStorage.removeItem("bug_guard_traps"); // 移行したらローカルは削除
};

// --- グッズ一覧の取得 ---
export const fetchTraps = async (userId: string | null): Promise<Trap[]> => {
  if (!userId) {
    const localTraps = localStorage.getItem("bug_guard_traps");
    return localTraps ? JSON.parse(localTraps) : [];
  }
  
  const q = query(collection(db, "traps"), where("userId", "==", userId), where("isActive", "==", true));
  const querySnapshot = await getDocs(q);
  const traps: Trap[] = [];
  querySnapshot.forEach((doc) => {
    traps.push(doc.data() as Trap);
  });
  return traps;
};