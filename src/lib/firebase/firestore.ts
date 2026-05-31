import { db } from "./config";
import { doc, setDoc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { Trap, Room, ExtendedRoom } from "@/types/trap";

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

// --- 間取り(Rooms)データの保存ロジック ---
export const saveRoomsData = async (rooms: ExtendedRoom[], userId: string | null) => {
  if (!userId) {
    localStorage.setItem("map_rooms_data", JSON.stringify(rooms));
  } else {
    // セキュリティルールをパスするため、許可された 'traps' コレクションに特殊ドキュメントとして保存
    await setDoc(doc(db, "traps", "layout-rooms-" + userId), {
      id: "layout-rooms-" + userId,
      userId,
      type: "system_layout_rooms",
      rooms,
      isActive: true
    });
  }
};

// --- 階数(Floors)データの保存ロジック ---
export const saveFloorsData = async (floors: number[], userId: string | null) => {
  if (!userId) {
    localStorage.setItem("map_floors_data", JSON.stringify(floors));
  } else {
    // セキュリティルールをパスするため、許可された 'traps' コレクションに特殊ドキュメントとして保存
    await setDoc(doc(db, "traps", "layout-floors-" + userId), {
      id: "layout-floors-" + userId,
      userId,
      type: "system_layout_floors",
      floors,
      isActive: true
    });
  }
};

// --- ユーザーデータ（間取り・階数）の取得 ---
export const fetchUserData = async (userId: string | null): Promise<{ rooms: ExtendedRoom[] | null; floors: number[] | null }> => {
  if (!userId) {
    const localRooms = localStorage.getItem("map_rooms_data");
    const localFloors = localStorage.getItem("map_floors_data");
    return {
      rooms: localRooms ? JSON.parse(localRooms) : null,
      floors: localFloors ? JSON.parse(localFloors) : null
    };
  }

  try {
    // 'traps' コレクションに格納したシステムドキュメントから間取りを取得
    const roomsRef = doc(db, "traps", "layout-rooms-" + userId);
    const roomsSnap = await getDoc(roomsRef);
    
    // 階数情報を取得
    const floorsRef = doc(db, "traps", "layout-floors-" + userId);
    const floorsSnap = await getDoc(floorsRef);

    let rooms: ExtendedRoom[] | null = null;
    let floors: number[] | null = null;

    if (roomsSnap.exists()) {
      rooms = roomsSnap.data().rooms || null;
    }
    if (floorsSnap.exists()) {
      floors = floorsSnap.data().floors || null;
    }

    return { rooms, floors };
  } catch (error) {
    console.error("Failed to fetch user layout data from traps collection:", error);
  }
  return { rooms: null, floors: null };
};

// --- データの移行（ゲストからアカウント連携時） ---
export const migrateLocalDataToFirebase = async (userId: string) => {
  // 1. トラップデータの移行
  const localTraps = localStorage.getItem("bug_guard_traps");
  if (localTraps) {
    const traps: Trap[] = JSON.parse(localTraps);
    for (const trap of traps) {
      await saveTrapData(trap, userId);
    }
    localStorage.removeItem("bug_guard_traps");
  }

  // 2. 間取り部屋データの移行
  const localRooms = localStorage.getItem("map_rooms_data");
  if (localRooms) {
    const rooms: ExtendedRoom[] = JSON.parse(localRooms);
    await saveRoomsData(rooms, userId);
    localStorage.removeItem("map_rooms_data");
  }

  // 3. 階数データの移行
  const localFloors = localStorage.getItem("map_floors_data");
  if (localFloors) {
    const floors: number[] = JSON.parse(localFloors);
    await saveFloorsData(floors, userId);
    localStorage.removeItem("map_floors_data");
  }
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
    const data = doc.data();
    // システムレイアウト用の特殊ドキュメントを除外！
    if (data.type !== "system_layout_rooms" && data.type !== "system_layout_floors") {
      traps.push(data as Trap);
    }
  });
  return traps;
};