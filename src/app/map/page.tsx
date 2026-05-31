"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useTraps } from "@/hooks/usetraps";
import { Trap, ExtendedRoom } from "@/types/trap";
import { TrapIcon } from "@/components/vector-icons";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

type ResizeDirection = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

export default function MapPage() {
  const [userId, setUserId] = useState<string | null>(null);

  // ログイン状態の監視
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          const simEmail = localStorage.getItem("simulated_user_email");
          setUserId(simEmail ? `sim-${simEmail}` : null);
        }
      });
      return () => unsubscribe();
    } catch {
      const simEmail = localStorage.getItem("simulated_user_email");
      setUserId(simEmail ? `sim-${simEmail}` : null);
    }
  }, []);

  // グローバル状態管理フックを呼び出す
  const {
    rooms,
    setRooms,
    traps,
    floors,
    setFloors,
    currentFloor,
    setCurrentFloor,
    addRoom,
    deleteRoom,
    undoDeleteRoom,
    canUndo,
    addTrap,
    deleteTrap,
    allTrapTypes,
    getTrapIcon,
    addCustomTrapType,
    updateTrapPosition,
    isInitialized,
  } = useTraps(userId);

  const [mode, setMode] = useState<"place" | "edit">("place");
  const containerRef = useRef<HTMLDivElement>(null);

  // 📐 ズーム状態
  const [zoom, setZoom] = useState(1);

  // マップ表示ベースサイズ
  const [houseSize, setHouseSize] = useState({ width: 600, height: 600 });

  // 🔍 モバイル端末か判定し、デフォルトズームを自動フィットさせる
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHouseSize = localStorage.getItem("map_house_size_data");
      if (savedHouseSize) {
        try {
          setHouseSize(JSON.parse(savedHouseSize));
        } catch {}
      }

      const screenWidth = window.innerWidth;
      if (screenWidth < 640) {
        setZoom(0.55);
      }

      const params = new URLSearchParams(window.location.search);
      if (params.get("createCustom") === "true") {
        setShowCustomModal(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("map_house_size_data", JSON.stringify(houseSize));
    }
  }, [houseSize, isInitialized]);

  // ドラッグ状態管理
  const [dragState, setDragState] = useState<{
    id: string;
    action: "move" | "resize" | "drag_trap";
    direction?: ResizeDirection;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
    roomId?: string;
  } | null>(null);

  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);
  const [touchStartZoom, setTouchStartZoom] = useState<number>(1);

  const dragStateRef = useRef(dragState);
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  // 配置するグッズの選択状態
  const [selectedTrapType, setSelectedTrapType] = useState<string>("ゴキブリホイホイ");
  const [placedLocation, setPlacedLocation] = useState<string>("");
  const [placementMonths, setPlacementMonths] = useState<number>(3);

  useEffect(() => {
    const foundType = allTrapTypes.find((t) => t.name === selectedTrapType);
    if (foundType) {
      setPlacementMonths(foundType.months);
    }
  }, [selectedTrapType, allTrapTypes]);

  // 新規部屋追加
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState("living");

  // カスタムグッズ作成用
  const [customName, setCustomName] = useState("");
  const [customMonths, setCustomMonths] = useState(3);
  const [customIcon, setCustomIcon] = useState("🛡️");
  const [showCustomModal, setShowCustomModal] = useState(false);

  // 設置グッズの詳細表示
  const [selectedTrap, setSelectedTrap] = useState<Trap | null>(null);

  // Undoトースト表示
  const [showUndoToast, setShowUndoToast] = useState(false);

  const getFloorName = (floor: number) => {
    return floor > 0 ? `${floor}F` : `B${Math.abs(floor)}F`;
  };

  // 💡 ドラッグ＆リサイズ時の座標計算処理
  useEffect(() => {
    const handleGlobalMove = (e: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state || !containerRef.current) return;

      e.preventDefault();

      const deltaX = (((e.clientX - state.startX) / zoom) / 600) * 100;
      const deltaY = (((e.clientY - state.startY) / zoom) / 600) * 100;

      if (state.action === "drag_trap") {
        const room = rooms.find((r) => r.id === state.roomId);
        if (!room) return;

        const deltaX_px = (e.clientX - state.startX) / zoom;
        const deltaY_px = (e.clientY - state.startY) / zoom;

        const room_w_px = (room.w / 100) * 600;
        const room_h_px = (room.h / 100) * 600;

        let newX = state.initialX + (deltaX_px / room_w_px);
        let newY = state.initialY + (deltaY_px / room_h_px);

        newX = Math.max(0.02, Math.min(0.98, newX));
        newY = Math.max(0.02, Math.min(0.98, newY));

        updateTrapPosition(state.id, newX, newY);
        return;
      }

      setRooms((prev) =>
        prev.map((r) => {
          if (r.id !== state.id) return r;

          if (state.action === "move") {
            let newX = Math.round(state.initialX + deltaX);
            let newY = Math.round(state.initialY + deltaY);
            newX = Math.max(0, Math.min(100 - r.w, newX));
            newY = Math.max(0, Math.min(100 - r.h, newY));
            return { ...r, x: newX, y: newY };
          } else {
            let newX = r.x;
            let newY = r.y;
            let newW = r.w;
            let newH = r.h;
            const dir = state.direction;

            if (dir?.includes("e")) {
              newW = Math.round(state.initialW + deltaX);
              newW = Math.max(8, Math.min(100 - state.initialX, newW));
            }
            if (dir?.includes("w")) {
              const proposedX = Math.round(state.initialX + deltaX);
              if (proposedX >= 0 && state.initialX + state.initialW - proposedX >= 8) {
                newX = proposedX;
                newW = state.initialX + state.initialW - proposedX;
              }
            }
            if (dir?.includes("s")) {
              newH = Math.round(state.initialH + deltaY);
              newH = Math.max(8, Math.min(100 - state.initialY, newH));
            }
            if (dir?.includes("n")) {
              const proposedY = Math.round(state.initialY + deltaY);
              if (proposedY >= 0 && state.initialY + state.initialH - proposedY >= 8) {
                newY = proposedY;
                newH = state.initialY + state.initialH - proposedY;
              }
            }
            return { ...r, x: newX, y: newY, w: newW, h: newH };
          }
        })
      );
    };

    const handleGlobalUp = () => {
      if (dragStateRef.current) setDragState(null);
    };

    if (dragState) {
      window.addEventListener("pointermove", handleGlobalMove, { passive: false });
      window.addEventListener("pointerup", handleGlobalUp);
    }

    return () => {
      window.removeEventListener("pointermove", handleGlobalMove);
      window.removeEventListener("pointerup", handleGlobalUp);
    };
  }, [dragState, zoom, rooms, setRooms, updateTrapPosition]);

  const currentFloorRooms = useMemo(() => {
    return rooms.filter((r) => r.floor === currentFloor);
  }, [rooms, currentFloor]);

  const handleAddUpperFloor = () => {
    const upperFloors = floors.filter(f => f > 0);
    const nextFloor = upperFloors.length > 0 ? Math.max(...upperFloors) + 1 : 1;
    setFloors([...floors, nextFloor]);
    setCurrentFloor(nextFloor);
  };

  const handleAddLowerFloor = () => {
    const lowerFloors = floors.filter(f => f < 0);
    const nextFloor = lowerFloors.length > 0 ? Math.min(...lowerFloors) - 1 : -1;
    setFloors([...floors, nextFloor]);
    setCurrentFloor(nextFloor);
  };

  const handleDeleteCurrentFloor = () => {
    if (floors.length <= 1) return;
    const floorName = getFloorName(currentFloor);
    if (!confirm(`本当に ${floorName} を削除しますか？床に置いてあるグッズもすべて非アクティブになります。`)) return;

    const targetRoomIds = rooms.filter(r => r.floor === currentFloor).map(r => r.id);
    setFloors(floors.filter(f => f !== currentFloor));
    setRooms(rooms.filter(r => r.floor !== currentFloor));
    targetRoomIds.forEach((rid) => {
      traps.filter(t => t.roomId === rid).forEach((t) => deleteTrap(t.id));
    });
    setCurrentFloor(floors.filter(f => f !== currentFloor)[0]);
  };

  const handleAddRoomClick = () => {
    if (!newRoomName.trim()) return;
    addRoom(newRoomName, newRoomType);
    setNewRoomName("");
  };

  const handleDeleteRoomClick = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteRoom(id);
    setShowUndoToast(true);
    setTimeout(() => {
      setShowUndoToast(false);
    }, 6000);
  };

  const handleUndoRoom = () => {
    const success = undoDeleteRoom();
    if (success) {
      setShowUndoToast(false);
    }
  };

  const handleRoomPointerDown = (room: ExtendedRoom, e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== "edit") return;
    e.stopPropagation();
    
    if ((e.target as HTMLElement).hasAttribute("data-resize-dir")) return;

    setDragState({
      id: room.id,
      action: "move",
      startX: e.clientX,
      startY: e.clientY,
      initialX: room.x,
      initialY: room.y,
      initialW: room.w,
      initialH: room.h,
    });
  };

  const handleTrapPointerDown = (trap: Trap, roomId: string, e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    
    setDragState({
      id: trap.id,
      action: "drag_trap",
      startX: e.clientX,
      startY: e.clientY,
      initialX: trap.x,
      initialY: trap.y,
      initialW: 0,
      initialH: 0,
      roomId: roomId,
    });
  };

  const handleHandlePointerDown = (room: ExtendedRoom, dir: ResizeDirection, e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== "edit") return;
    e.stopPropagation();
    e.preventDefault();

    setDragState({
      id: room.id,
      action: "resize",
      direction: dir,
      startX: e.clientX,
      startY: e.clientY,
      initialX: room.x,
      initialY: room.y,
      initialW: room.w,
      initialH: room.h,
    });
  };

  const handleRoomClick = async (room: ExtendedRoom, e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== "place") return;
    if ((e.target as HTMLElement).closest(".trap-marker")) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    const months = placementMonths;

    try {
      await addTrap(
        selectedTrapType,
        placedLocation || `${room.name}の防衛ポイント`,
        room.id,
        clickX,
        clickY,
        months
      );
      setPlacedLocation("");
    } catch {
      alert("データの保存に失敗しました。");
    }
  };

  const handleTrapClick = (trap: Trap, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTrap(trap);
  };

  const handleRemoveTrap = async () => {
    if (!selectedTrap) return;
    try {
      await deleteTrap(selectedTrap.id);
      setSelectedTrap(null);
    } catch {
      alert("グッズの削除に失敗しました。");
    }
  };

  const handleCreateCustomType = () => {
    if (!customName.trim()) {
      alert("グッズの名前を入力してください。");
      return;
    }
    const success = addCustomTrapType(customName, customMonths, customIcon);
    if (success) {
      setSelectedTrapType(customName);
      setCustomName("");
      setShowCustomModal(false);
    } else {
      alert("そのグッズ名はすでに登録されています。");
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDist(dist);
      setTouchStartZoom(zoom);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStartDist;
      let newZoom = touchStartZoom * ratio;
      newZoom = Math.max(0.4, Math.min(1.6, Number(newZoom.toFixed(2))));
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartDist(null);
  };

  if (!isInitialized) {
    return (
      <div className="p-5 flex flex-col min-h-screen bg-slate-950 text-cyan-400 font-mono text-xs items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border border-cyan-500 border-t-transparent"></div>
        <span>LOADING TACTICAL MAPS / 戦略間取り図の読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col min-h-screen bg-slate-950 text-zinc-100 relative">
      
      {/* ⚠️ Undo 復元トースト通知 */}
      {showUndoToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md animate-slide-up">
          <span>防衛区画を閉鎖しました（設置済みの防衛装備は一時解除）</span>
          <button
            onClick={handleUndoRoom}
            className="bg-cyan-500 hover:bg-cyan-600 text-zinc-950 font-black px-2.5 py-1 rounded-lg transition"
          >
            復元する
          </button>
        </div>
      )}

      {/* 📍 設置グッズの詳細ポップアップ（モーダル） */}
      {selectedTrap && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-zinc-850 flex flex-col gap-4 animate-scale-up text-zinc-200">
            <div className="flex justify-between items-start border-b border-zinc-850 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-zinc-950 rounded-2xl flex items-center justify-center flex-shrink-0 border border-zinc-800">
                  <TrapIcon id={selectedTrap.name} size={40} />
                </span>
                <div>
                  <h3 className="font-black text-sm text-zinc-100">{selectedTrap.name}</h3>
                  <p className="text-[10px] text-zinc-500 font-mono">LOCATION: {selectedTrap.placedLocation}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTrap(null)} className="text-zinc-500 hover:text-zinc-300 text-lg font-bold">×</button>
            </div>
            
            <div className="bg-zinc-950 p-3 rounded-xl space-y-1.5 text-xs text-zinc-400 font-mono border border-zinc-900">
              <div className="flex justify-between">
                <span>配備開始日:</span>
                <strong className="text-zinc-300">{selectedTrap.placedDate}</strong>
              </div>
              <div className="flex justify-between">
                <span>耐用限界期限:</span>
                <strong className="text-red-400">{selectedTrap.expirationDate}</strong>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleRemoveTrap}
                className="flex-1 py-2.5 bg-red-950/40 hover:bg-red-900/40 border border-red-900 text-red-400 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 active:scale-[0.98]"
              >
                装備を回収する
              </button>
              <button
                onClick={() => setSelectedTrap(null)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition border border-zinc-700"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛡️ オリジナルカスタムグッズ追加モーダル */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-zinc-850 flex flex-col gap-4 animate-scale-up text-zinc-200">
            <div className="border-b border-zinc-850 pb-2">
              <h3 className="font-black text-sm text-cyan-400 tracking-wider">🛠️ 新規防衛装備（グッズ）の調合</h3>
              <p className="text-[9px] text-zinc-500 font-mono">Custom Defense Arsenal Configurator</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">防衛グッズの一般名称</label>
                <input
                  type="text"
                  placeholder="例: バルサン置くだけダニシート"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-200 placeholder-zinc-700 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">耐用限界（持続稼働月数）</label>
                <select
                  value={customMonths}
                  onChange={(e) => setCustomMonths(Number(e.target.value))}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="1">1ヶ月 (短期スプレー等)</option>
                  <option value="2">2ヶ月 (ダニ用等)</option>
                  <option value="3">3ヶ月 (一般捕獲罠等)</option>
                  <option value="6">6ヶ月 (強力誘引毒餌剤等)</option>
                  <option value="12">12ヶ月 (1年間持続防壁)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">コンソール表示アイコン</label>
                <div className="flex gap-2 flex-wrap bg-zinc-950 p-2.5 rounded-xl border border-zinc-900 justify-between">
                  {["🪳", "🕷️", "🦟", "🐜", "🌿", "🧴", "📦", "🪙", "🛡️"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCustomIcon(emoji)}
                      className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition border ${
                        customIcon === emoji ? "bg-cyan-500 border-cyan-400 text-zinc-950 shadow" : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCreateCustomType}
                className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-zinc-950 rounded-xl text-xs font-black transition shadow-md active:scale-[0.98]"
              >
                装備を調合し選択する
              </button>
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition border border-zinc-700"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div className="border-b border-zinc-800 pb-2 mb-4">
        <h1 className="text-xl font-bold text-cyan-400 flex items-center gap-2 font-mono uppercase tracking-wider">
          🗺️ STRATEGIC MAP / 戦略配置マップ
        </h1>
        <p className="text-[9px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">
          Defensive Layout Configurator & Arsenal Placements
        </p>
      </div>

      {/* モード切り替え (サイバー調) */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("place")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-all ${
            mode === "place" 
              ? "bg-cyan-500 text-zinc-950 border-cyan-400 shadow-md scale-[1.01]" 
              : "bg-zinc-900 text-zinc-400 border-zinc-800/80"
          }`}
        >
          🚨 装備を配備する (配備プロトコル)
        </button>
        <button
          onClick={() => setMode("edit")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-all ${
            mode === "edit" 
              ? "bg-indigo-600 text-zinc-100 border-indigo-500 shadow-md scale-[1.01]" 
              : "bg-zinc-900 text-zinc-400 border-zinc-800/80"
          }`}
        >
          📐 間取りを編集する (設計プロトコル)
        </button>
      </div>

      {/* コントロールパネル */}
      {mode === "place" ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md p-4 rounded-2xl shadow-sm mb-4 flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-zinc-850 pb-1.5">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider font-mono">🛠️ SELECT ARSENAL / 配備装備の選定</h2>
          </div>

          <button
            onClick={() => setShowCustomModal(true)}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-zinc-950 rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            オリジナル防衛装備（グッズ）を調合する
          </button>

          <div className="flex flex-col gap-2">
            <select
              value={selectedTrapType}
              onChange={(e) => setSelectedTrapType(e.target.value)}
              className="w-full p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs font-bold text-zinc-200 focus:outline-none"
            >
              {allTrapTypes.map((type) => (
                <option key={type.name} value={type.name}>
                  {type.icon} {type.name} (定格: {type.months}ヶ月)
                </option>
              ))}
            </select>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="配備区画のメモ (例: 冷蔵庫の裏隙間)"
                  value={placedLocation}
                  onChange={(e) => setPlacedLocation(e.target.value)}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs font-medium text-zinc-200 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={placementMonths}
                  onChange={(e) => setPlacementMonths(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2.5 pr-8 bg-zinc-950 border border-zinc-850 rounded-xl text-xs font-black text-center text-zinc-200 focus:outline-none"
                  title="有効稼働限界月数"
                />
                <span className="absolute right-2 text-[8px] font-black text-zinc-500 pointer-events-none uppercase font-mono">MON</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-cyan-400 font-bold bg-cyan-950/30 p-2.5 rounded-lg leading-normal font-mono border border-cyan-900/40">
            <strong>DEPLOYMENT ACTION:</strong> 装備を選択後、防衛線（間取り）上の配備したいピンポイント区画をタップしてください。
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md p-4 rounded-2xl shadow-sm mb-4 space-y-3">
          <div>
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider font-mono mb-2">CANVAS DIMENSIONS / キャンバスサイズ（微調整用）</h2>
            <div className="flex items-center gap-4 text-xs bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl w-fit font-mono">
              <label className="text-zinc-400">WIDTH: <input type="number" min="200" step="50" value={houseSize.width} onChange={(e) => setHouseSize({ ...houseSize, width: Math.max(200, Number(e.target.value)) })} className="w-16 p-1 border border-zinc-800 rounded bg-zinc-900 text-center text-zinc-100 font-mono focus:outline-none" /> px</label>
              <label className="text-zinc-400">HEIGHT: <input type="number" min="200" step="50" value={houseSize.height} onChange={(e) => setHouseSize({ ...houseSize, height: Math.max(200, Number(e.target.value)) })} className="w-16 p-1 border border-zinc-800 rounded bg-zinc-900 text-center text-zinc-100 font-mono focus:outline-none" /> px</label>
            </div>
          </div>
          <hr className="border-zinc-800/60" />
          <div>
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider font-mono mb-2">ADD ZONE / {getFloorName(currentFloor)} に新しい区画を追加</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="区画名 (例: バスルーム, 洗面脱衣所)"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="flex-1 p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs font-bold text-zinc-200 placeholder-zinc-700 focus:outline-none"
              />
              <button
                onClick={handleAddRoomClick}
                className="px-4 bg-indigo-600 hover:bg-indigo-700 border border-indigo-500 text-white rounded-xl text-xs font-black transition active:scale-[0.98]"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🏢 階層＆ズーム管理バー */}
      <div className="flex items-center justify-between gap-2 mb-3 bg-zinc-900/60 border border-zinc-800/80 p-2.5 rounded-2xl flex-wrap">
        {/* 左: 階数操作 */}
        <div className="flex items-center gap-1.5">
          <button onClick={handleAddLowerFloor} className="px-2.5 py-1.5 rounded-lg text-[9px] font-black bg-cyan-950/40 border border-cyan-850 text-cyan-400 hover:bg-cyan-900/40 transition font-mono">ADD BASEMENT</button>
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-850 overflow-x-auto max-w-[150px] sm:max-w-none">
            {floors.sort((a, b) => a - b).map((floor) => (
              <button
                key={floor}
                onClick={() => setCurrentFloor(floor)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition font-mono ${
                  currentFloor === floor ? "bg-cyan-500 text-zinc-950 shadow" : "text-zinc-500 hover:bg-zinc-900"
                }`}
              >
                {getFloorName(floor)}
              </button>
            ))}
          </div>
          <button onClick={handleAddUpperFloor} className="px-2.5 py-1.5 rounded-lg text-[9px] font-black bg-cyan-950/40 border border-cyan-850 text-cyan-400 hover:bg-cyan-900/40 transition font-mono">ADD UPPER</button>
          
          {mode === "edit" && floors.length > 1 && (
            <button
              onClick={handleDeleteCurrentFloor}
              className="px-2.5 py-1.5 rounded-lg text-[9px] font-black bg-red-950/40 text-red-400 border border-red-900 hover:bg-red-900/40 transition font-mono"
            >
              DELETE FLOOR
            </button>
          )}
        </div>

        {/* 右: ズーム調整ボタン */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded-xl border border-zinc-850 shadow ml-auto">
          <span className="text-[9px] font-black text-zinc-500 px-1 font-mono uppercase">ZOOM:</span>
          <button
            onClick={() => setZoom(Math.max(0.4, Number((zoom - 0.1).toFixed(2))))}
            className="w-6 h-6 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-300"
          >
            -
          </button>
          <span className="text-[9px] font-black text-cyan-400 min-w-[36px] text-center font-mono">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(1.6, Number((zoom + 0.1).toFixed(2))))}
            className="w-6 h-6 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-300"
          >
            +
          </button>
          <button
            onClick={() => setZoom(window.innerWidth < 640 ? 0.55 : 1)}
            className="text-[8px] font-black bg-zinc-900 hover:bg-zinc-800 px-1.5 py-1 rounded border border-zinc-850 text-zinc-500 font-mono uppercase"
          >
            RESET
          </button>
        </div>
      </div>

      {/* キャンバス外周スクロール枠 */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full overflow-auto border border-zinc-800 bg-zinc-950 rounded-3xl p-4 max-h-[62vh] shadow-inner flex justify-center items-start min-h-[300px]"
      >
        <div
          style={{
            width: `${houseSize.width * zoom}px`,
            height: `${houseSize.height * zoom}px`,
            overflow: "hidden",
            position: "relative",
            transition: "width 0.1s ease, height 0.1s ease",
          }}
          className="flex-shrink-0"
        >
          <div 
            ref={containerRef}
            className="relative bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden"
            style={{
              width: `${houseSize.width}px`,
              height: `${houseSize.height}px`,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              touchAction: "none",
              // サイバーな背景グリッドパターン
              backgroundImage: "radial-gradient(#1e293b 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}
          >
            {/* 各部屋の描画 */}
            {currentFloorRooms.map((room) => (
              <div
                key={room.id}
                onClick={(e) => handleRoomClick(room, e)}
                onPointerDown={(e) => handleRoomPointerDown(room, e)}
                className={`absolute border-2 rounded-2xl shadow flex items-center justify-center select-none touch-none transition-all duration-150 ${
                  mode === "edit"
                    ? "bg-indigo-950/40 border-indigo-500/70 cursor-move hover:bg-indigo-950/60"
                    : "bg-cyan-950/20 border-cyan-600/30 cursor-crosshair hover:bg-cyan-950/30"
                }`}
                style={{
                  left: `${room.x}%`,
                  top: `${room.y}%`,
                  width: `${room.w}%`,
                  height: `${room.h}%`,
                  touchAction: "none",
                }}
              >
                {/* 部屋名表示（編集モード時は削除ボタンを併記） */}
                <div className="flex flex-col items-center gap-1 pointer-events-none select-none">
                  <span className={`text-[10px] font-black select-none tracking-wide ${mode === "edit" ? "text-indigo-300" : "text-cyan-300"}`}>
                    {room.name}
                  </span>
                  {mode === "edit" && (
                    <button
                      onClick={(e) => handleDeleteRoomClick(room.id, room.name, e)}
                      className="pointer-events-auto bg-red-950/60 border border-red-800 hover:bg-red-900/60 text-red-400 w-10 h-5 flex items-center justify-center rounded-lg text-[9px] font-black transition z-30 font-mono"
                      title="区画削除"
                    >
                      DELETE
                    </button>
                  )}
                </div>

                {/* リサイズ掴み手（編集モード用） */}
                {mode === "edit" && (
                  <>
                    <div data-resize-dir="n" onPointerDown={(e) => handleHandlePointerDown(room, "n", e)} className="absolute top-0 left-3 right-3 h-3 cursor-n-resize -top-1.5 bg-transparent" />
                    <div data-resize-dir="s" onPointerDown={(e) => handleHandlePointerDown(room, "s", e)} className="absolute bottom-0 left-3 right-3 h-3 cursor-s-resize -bottom-1.5 bg-transparent" />
                    <div data-resize-dir="e" onPointerDown={(e) => handleHandlePointerDown(room, "e", e)} className="absolute right-0 top-3 bottom-3 w-3 cursor-e-resize -right-1.5 bg-transparent" />
                    <div data-resize-dir="w" onPointerDown={(e) => handleHandlePointerDown(room, "w", e)} className="absolute left-0 top-3 bottom-3 w-3 cursor-w-resize -left-1.5 bg-transparent" />
                    <div data-resize-dir="nw" onPointerDown={(e) => handleHandlePointerDown(room, "nw", e)} className="absolute top-0 left-0 w-3.5 h-3.5 cursor-nw-resize -top-1 -left-1 bg-transparent" />
                    <div data-resize-dir="ne" onPointerDown={(e) => handleHandlePointerDown(room, "ne", e)} className="absolute top-0 right-0 w-3.5 h-3.5 cursor-ne-resize -top-1 -right-1 bg-transparent" />
                    <div data-resize-dir="sw" onPointerDown={(e) => handleHandlePointerDown(room, "sw", e)} className="absolute bottom-0 left-0 w-3.5 h-3.5 cursor-sw-resize -bottom-1 -left-1 bg-transparent" />
                    <div data-resize-dir="se" onPointerDown={(e) => handleHandlePointerDown(room, "se", e)} className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-se-resize -bottom-1 -right-1 bg-transparent" />
                  </>
                )}

                {/* 設置グッズのピン（トラップ）の描画 */}
                {traps.filter(t => t.roomId === room.id).map((trap) => (
                  <button
                    key={trap.id}
                    onPointerDown={(e) => handleTrapPointerDown(trap, room.id, e)}
                    onClick={(e) => handleTrapClick(trap, e)}
                    className="absolute trap-marker z-20 pointer-events-auto p-1 bg-zinc-950 rounded-xl border border-cyan-500/70 hover:border-cyan-400 shadow-lg flex items-center justify-center transition active:scale-95 cursor-grab touch-none"
                    style={{
                      left: `calc(${trap.x * 100}% - 14px)`,
                      top: `calc(${trap.y * 100}% - 14px)`,
                      width: "28px",
                      height: "28px",
                      touchAction: "none"
                    }}
                    title={`${trap.name}: ${trap.placedLocation}`}
                  >
                    <TrapIcon id={trap.name} size={20} />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}