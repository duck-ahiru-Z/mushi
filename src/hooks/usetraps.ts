"use client";
import { useState, useEffect, useCallback } from "react";
import { Room, Trap, ExtendedRoom } from "@/types/trap";
import { saveTrapData, fetchTraps, saveRoomsData, saveFloorsData, fetchUserData } from "@/lib/firebase/firestore";

export interface CustomTrapType {
  name: string;
  months: number;
  icon: string;
}

const DEFAULT_ROOMS: ExtendedRoom[] = [
  { id: "room-1", name: "玄関・廊下", type: "entrance", x: 40, y: 80, w: 20, h: 20, floor: 1 },
  { id: "room-2", name: "リビングダイニング", type: "living", x: 10, y: 35, w: 45, h: 45, floor: 1 },
  { id: "room-3", name: "キッチン", type: "kitchen", x: 10, y: 10, w: 25, h: 25, floor: 1 },
  { id: "room-4", name: "浴室・洗面所", type: "bathroom", x: 40, y: 10, w: 25, h: 25, floor: 1 },
  { id: "room-5", name: "トイレ", type: "toilet", x: 40, y: 40, w: 15, h: 15, floor: 1 },
  { id: "room-6", name: "洋室（寝室）", type: "bedroom", x: 70, y: 10, w: 25, h: 35, floor: 1 },
  { id: "room-7", name: "洋室・子供部屋", type: "bedroom", x: 70, y: 50, w: 25, h: 35, floor: 1 },
];

export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  rooms: ExtendedRoom[];
  floors: number[];
}

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: "2ldk",
    name: "標準的な 2LDK (マンション)",
    description: "LDKと洋室2部屋、水回りがコンパクトにまとまった一般的な配置です。",
    floors: [1],
    rooms: DEFAULT_ROOMS
  },
  {
    id: "1k",
    name: "一人暮らし向け 1K",
    description: "単身者向けのシンプルで無駄のないコンパクトな配置です。",
    floors: [1],
    rooms: [
      { id: "room-1k-1", name: "玄関・ミニキッチン", type: "kitchen", x: 35, y: 65, w: 30, h: 30, floor: 1 },
      { id: "room-1k-2", name: "洋室 (居室)", type: "living", x: 20, y: 15, w: 60, h: 45, floor: 1 },
      { id: "room-1k-3", name: "ユニットバス", type: "bathroom", x: 65, y: 65, w: 20, h: 25, floor: 1 },
      { id: "room-1k-4", name: "バルコニー", type: "balcony", x: 20, y: 5, w: 60, h: 8, floor: 1 },
    ]
  },
  {
    id: "3ldk",
    name: "広々 3LDK (ファミリー)",
    description: "家族向けの部屋数が多いスタンダードなマンション・平屋向け配置です。",
    floors: [1],
    rooms: [
      { id: "room-3f-1", name: "玄関・廊下", type: "entrance", x: 45, y: 75, w: 15, h: 25, floor: 1 },
      { id: "room-3f-2", name: "リビングダイニング", type: "living", x: 5, y: 35, w: 40, h: 45, floor: 1 },
      { id: "room-3f-3", name: "対面キッチン", type: "kitchen", x: 5, y: 10, w: 25, h: 25, floor: 1 },
      { id: "room-3f-4", name: "浴室・脱衣所", type: "bathroom", x: 35, y: 10, w: 25, h: 25, floor: 1 },
      { id: "room-3f-5", name: "トイレ", type: "toilet", x: 35, y: 40, w: 15, h: 15, floor: 1 },
      { id: "room-3f-6", name: "主寝室", type: "bedroom", x: 65, y: 10, w: 30, h: 30, floor: 1 },
      { id: "room-3f-7", name: "子供部屋1", type: "bedroom", x: 65, y: 45, w: 30, h: 25, floor: 1 },
      { id: "room-3f-8", name: "子供部屋2 / 和室", type: "bedroom", x: 65, y: 75, w: 30, h: 20, floor: 1 },
    ]
  },
  {
    id: "2story",
    name: "一戸建て 2階建てスタイル",
    description: "1階に共有LDKと水回り、2階にプライベート寝室を集約した一軒家タイプです。",
    floors: [1, 2],
    rooms: [
      { id: "room-2s-1", name: "玄関・ホール", type: "entrance", x: 10, y: 65, w: 25, h: 30, floor: 1 },
      { id: "room-2s-2", name: "リビング・ダイニング", type: "living", x: 40, y: 30, w: 50, h: 65, floor: 1 },
      { id: "room-2s-3", name: "キッチン", type: "kitchen", x: 40, y: 5, w: 30, h: 25, floor: 1 },
      { id: "room-2s-4", name: "洗面脱衣所", type: "bathroom", x: 10, y: 5, w: 25, h: 25, floor: 1 },
      { id: "room-2s-5", name: "浴室", type: "bathroom", x: 10, y: 30, w: 25, h: 25, floor: 1 },
      { id: "room-2s-6", name: "1Fトイレ", type: "toilet", x: 75, y: 5, w: 15, h: 15, floor: 1 },
      { id: "room-2s-7", name: "主寝室", type: "bedroom", x: 10, y: 10, w: 40, h: 40, floor: 2 },
      { id: "room-2s-8", name: "子供部屋A", type: "bedroom", x: 55, y: 10, w: 35, h: 35, floor: 2 },
      { id: "room-2s-9", name: "子供部屋B", type: "bedroom", x: 55, y: 50, w: 35, h: 45, floor: 2 },
      { id: "room-2s-10", name: "2F廊下・階段", type: "entrance", x: 10, y: 55, w: 40, h: 20, floor: 2 },
      { id: "room-2s-11", name: "2Fトイレ", type: "toilet", x: 10, y: 80, w: 15, h: 15, floor: 2 },
    ]
  }
];

export const PRESET_TRAP_TYPES: CustomTrapType[] = [
  { name: "ゴキブリホイホイ", months: 3, icon: "🪳" },
  { name: "ブラックキャップ", months: 6, icon: "🪙" },
  { name: "ダニよけシート", months: 2, icon: "🕷️" },
  { name: "コバエがいなくなるスプレー", months: 1, icon: "🦟" },
  { name: "アリの巣コロリ", months: 6, icon: "🐜" },
];

export function useTraps(userId: string | null = null) {
  const [rooms, setRooms] = useState<ExtendedRoom[]>([]);
  const [traps, setTraps] = useState<Trap[]>([]);
  const [floors, setFloors] = useState<number[]>([1, 2]);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [customTrapTypes, setCustomTrapTypes] = useState<CustomTrapType[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializedUserId, setInitializedUserId] = useState<string | null>(null);

  // Undo (部屋削除の復元) 用のスタック
  const [lastDeletedRoom, setLastDeletedRoom] = useState<{
    room: ExtendedRoom;
    traps: Trap[];
  } | null>(null);

  // 1. 初期データ読み込み
  useEffect(() => {
    const initializeData = async () => {
      let loadedRooms: ExtendedRoom[] = [];
      let loadedFloors: number[] = [1, 2];

      if (userId) {
        // ログインモード：Firestoreから間取り・階数を取得
        try {
          const userData = await fetchUserData(userId);
          if (userData.rooms && userData.rooms.length > 0) {
            loadedRooms = userData.rooms;
          }
          if (userData.floors && userData.floors.length > 0) {
            loadedFloors = userData.floors;
          }
        } catch (err) {
          console.error("Failed to load user layout from firestore:", err);
        }
      }

      // Firestoreにデータがなかった、またはゲストモードの場合、LocalStorageから取得
      if (loadedRooms.length === 0) {
        const savedRooms = localStorage.getItem("map_rooms_data");
        if (savedRooms) {
          try {
            const parsed = JSON.parse(savedRooms);
            if (Array.isArray(parsed) && parsed.length > 0) {
              loadedRooms = parsed;
            } else {
              loadedRooms = DEFAULT_ROOMS;
            }
          } catch {
            loadedRooms = DEFAULT_ROOMS;
          }
        } else {
          loadedRooms = DEFAULT_ROOMS;
        }
      }

      if (loadedFloors.length === 2 && loadedFloors[0] === 1 && loadedFloors[1] === 2) {
        const savedFloors = localStorage.getItem("map_floors_data");
        if (savedFloors) {
          try {
            loadedFloors = JSON.parse(savedFloors);
          } catch {}
        }
      }

      setRooms(loadedRooms);
      setFloors(loadedFloors);

      // カスタムグッズ種類
      const savedCustomTypes = localStorage.getItem("custom_trap_types");
      if (savedCustomTypes) {
        try {
          setCustomTrapTypes(JSON.parse(savedCustomTypes));
        } catch {
          setCustomTrapTypes([]);
        }
      }

      // グッズ一覧
      try {
        const loadedTraps = await fetchTraps(userId);
        setTraps(loadedTraps);
      } catch (err) {
        console.error("Failed to load traps:", err);
      }

      setIsInitialized(true);
      setInitializedUserId(userId);
    };

    initializeData();
  }, [userId]);

  // 2. 部屋・階層・カスタム種類の同期 (Local ＆ Firestore)
  useEffect(() => {
    if (isInitialized && initializedUserId === userId) {
      localStorage.setItem("map_rooms_data", JSON.stringify(rooms));
      if (userId) {
        saveRoomsData(rooms, userId).catch(err => console.error("Failed to sync rooms to firestore:", err));
      }
    }
  }, [rooms, isInitialized, initializedUserId, userId]);

  useEffect(() => {
    if (isInitialized && initializedUserId === userId) {
      localStorage.setItem("map_floors_data", JSON.stringify(floors));
      if (userId) {
        saveFloorsData(floors, userId).catch(err => console.error("Failed to sync floors to firestore:", err));
      }
    }
  }, [floors, isInitialized, initializedUserId, userId]);

  useEffect(() => {
    if (isInitialized && initializedUserId === userId) {
      localStorage.setItem("custom_trap_types", JSON.stringify(customTrapTypes));
    }
  }, [customTrapTypes, isInitialized, initializedUserId, userId]);


  // 3. 部屋の追加
  const addRoom = useCallback((name: string, type: string = "living") => {
    const newRoom: ExtendedRoom = {
      id: `room-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`,
      name,
      type,
      x: 30,
      y: 30,
      w: 30,
      h: 30,
      floor: currentFloor,
    };
    setRooms((prev) => [...prev, newRoom]);
    return newRoom;
  }, [currentFloor]);

  // 4. 部屋の削除 (関連する設置グッズも一時退避してUndo可能に)
  const deleteRoom = useCallback((id: string) => {
    const roomToDelete = rooms.find((r) => r.id === id);
    if (!roomToDelete) return;

    // 部屋に関連付けられたグッズを抽出
    const associatedTraps = traps.filter((t) => t.roomId === id && t.isActive);

    // Undo情報にセット
    setLastDeletedRoom({
      room: roomToDelete,
      traps: associatedTraps,
    });

    // 部屋を削除
    setRooms((prev) => prev.filter((r) => r.id !== id));
    // 関連グッズを非アクティブにしてDB同期
    setTraps((prev) =>
      prev.map((t) => {
        if (t.roomId === id) {
          const updated = { ...t, isActive: false };
          saveTrapData(updated, userId);
          return updated;
        }
        return t;
      })
    );
  }, [rooms, traps, userId]);

  // 5. 部屋削除の復元 (Undo)
  const undoDeleteRoom = useCallback(() => {
    if (!lastDeletedRoom) return false;

    const { room, traps: trapsToRestore } = lastDeletedRoom;

    // 部屋を戻す
    setRooms((prev) => [...prev, room]);

    // グッズを戻す
    setTraps((prev) =>
      prev.map((t) => {
        const shouldRestore = trapsToRestore.some((tr) => tr.id === t.id);
        if (shouldRestore) {
          const updated = { ...t, isActive: true };
          saveTrapData(updated, userId);
          return updated;
        }
        return t;
      })
    );

    // スタックをクリア
    setLastDeletedRoom(null);
    return true;
  }, [lastDeletedRoom, userId]);

  // 6. グッズの追加
  const addTrap = useCallback(async (
    name: string,
    placedLocation: string,
    roomId: string,
    x: number,
    y: number,
    months: number
  ) => {
    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + months);

    const newTrap: Trap = {
      id: `trap-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`,
      userId,
      name,
      placedLocation,
      roomId,
      x,
      y,
      placedDate: new Date().toISOString().split("T")[0],
      expirationDate: expDate.toISOString().split("T")[0],
      isActive: true,
    };

    // ローカルステートを即時更新
    setTraps((prev) => [...prev, newTrap]);

    // DB（LocalStorage or Firestore）に保存
    try {
      await saveTrapData(newTrap, userId);
      return newTrap;
    } catch (err) {
      // 失敗時はロールバック
      setTraps((prev) => prev.filter((t) => t.id !== newTrap.id));
      throw err;
    }
  }, [userId]);

  // 7. グッズの削除（非アクティブ化または完全削除）
  const deleteTrap = useCallback(async (trapId: string) => {
    // ローカルステート更新
    setTraps((prev) =>
      prev.map((t) => {
        if (t.id === trapId) {
          const updated = { ...t, isActive: false };
          // 保存処理
          saveTrapData(updated, userId);
          return updated;
        }
        return t;
      })
    );

    // Firebaseが完全に削除する場合はそれに従うが、今回は `isActive = false` に統一して同期性を保つ
    // LocalStorageの場合は完全削除も可能。ここでは `isActive = false` に更新して同期
    // ついでに LocalStorage の配列から物理削除して「ホームで消えない」を解消する
    if (!userId) {
      const localTrapsStr = localStorage.getItem("bug_guard_traps");
      if (localTrapsStr) {
        const localTraps: Trap[] = JSON.parse(localTrapsStr);
        const filtered = localTraps.filter((t) => t.id !== trapId);
        localStorage.setItem("bug_guard_traps", JSON.stringify(filtered));
        // stateも物理同期する
        setTraps(filtered);
      }
    }
  }, [userId]);

  // 8. カスタムグッズ種類の追加
  const addCustomTrapType = useCallback((name: string, months: number, icon: string = "🛡️") => {
    if (customTrapTypes.some((t) => t.name === name)) return false;
    const newType: CustomTrapType = { name, months, icon };
    setCustomTrapTypes((prev) => [...prev, newType]);
    return true;
  }, [customTrapTypes]);

  // カスタムグッズ種類の削除
  const deleteCustomTrapType = useCallback((name: string) => {
    setCustomTrapTypes((prev) => prev.filter((t) => t.name !== name));
  }, []);

  // 間取りテンプレートの適用
  const applyLayoutTemplate = useCallback((templateId: string) => {
    const template = LAYOUT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return false;
    
    setRooms(template.rooms);
    setFloors(template.floors);
    setCurrentFloor(template.floors[0]);
    return true;
  }, []);

  // 全グッズの種類リスト（プリセット＋カスタム）
  const allTrapTypes = [
    ...PRESET_TRAP_TYPES,
    ...customTrapTypes,
  ];

  // 特定の名前のアイコンを取得する関数
  const getTrapIcon = useCallback((name: string) => {
    const found = allTrapTypes.find((t) => t.name === name);
    return found ? found.icon : "🛡️";
  }, [allTrapTypes]);

  // 9. グッズ位置の更新（ドラッグ＆ドロップ対応）
  const updateTrapPosition = useCallback(async (trapId: string, x: number, y: number) => {
    setTraps((prev) =>
      prev.map((t) => (t.id === trapId ? { ...t, x, y } : t))
    );
    
    // ローカルストレージまたはデータベースの同期
    if (!userId) {
      const localTrapsStr = localStorage.getItem("bug_guard_traps");
      if (localTrapsStr) {
        const localTraps: Trap[] = JSON.parse(localTrapsStr);
        const idx = localTraps.findIndex((t) => t.id === trapId);
        if (idx >= 0) {
          localTraps[idx] = { ...localTraps[idx], x, y };
          localStorage.setItem("bug_guard_traps", JSON.stringify(localTraps));
        }
      }
    } else {
      // データベース同期
      setTraps((prev) => {
        const found = prev.find((t) => t.id === trapId);
        if (found) {
          saveTrapData(found, userId);
        }
        return prev;
      });
    }
  }, [userId]);

  return {
    rooms,
    setRooms,
    traps: traps.filter(t => t.isActive), // アクティブなものだけを返すことで同期バグを完全防止！
    allTrapsRaw: traps, // 必要に応じて生データを返す
    floors,
    setFloors,
    currentFloor,
    setCurrentFloor,
    customTrapTypes,
    addCustomTrapType,
    deleteCustomTrapType,
    applyLayoutTemplate,
    allTrapTypes,
    getTrapIcon,
    isInitialized,
    addRoom,
    deleteRoom,
    undoDeleteRoom,
    canUndo: !!lastDeletedRoom,
    addTrap,
    deleteTrap,
    updateTrapPosition,
  };
}
