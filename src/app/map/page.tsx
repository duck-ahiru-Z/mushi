"use client";
import { useState, useEffect, useRef } from "react";
import { useTraps } from "@/hooks/usetraps";
import { Trap, ExtendedRoom } from "@/types/trap";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

// 新しく作成したサブコンポーネントをインポート
import { CustomTrapModal } from "@/components/map/CustomTrapModal";
import { TrapDetailModal } from "@/components/map/TrapDetailModal";
import { FloorSelector } from "@/components/map/FloorSelector";
import { TrapSelector } from "@/components/map/TrapSelector";
import { RoomEditor } from "@/components/map/RoomEditor";
import { MapCanvas } from "@/components/map/MapCanvas";

type ResizeDirection = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

export default function MapPage() {
  const [userId, setUserId] = useState<string | null>(null);

  // ログイン状態の監視
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUserId(user ? user.uid : null);
      });
      return () => unsubscribe();
    } catch {
      setUserId(null);
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
    addTrap,
    deleteTrap,
    allTrapTypes,
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
        placedLocation || `${room.name}の隅`,
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
    return <div className="p-5 text-slate-500 text-sm">マイ間取りのデータを読み込み中...</div>;
  }

  return (
    <div className="p-4 flex flex-col min-h-screen bg-slate-50 text-slate-800 relative">
      
      {/* ⚠️ Undo 復元トースト */}
      {showUndoToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md animate-slide-up">
          <span>部屋を削除しました（設置済みの防衛も一時解除）</span>
          <button
            onClick={handleUndoRoom}
            className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-black px-2.5 py-1 rounded-lg transition"
          >
            元に戻す
          </button>
        </div>
      )}

      {/* 📍 設置グッズの詳細ポップアップ（モーダル） */}
      <TrapDetailModal
        trap={selectedTrap}
        onClose={() => setSelectedTrap(null)}
        onRemove={handleRemoveTrap}
      />

      {/* 🛡️ オリジナルカスタムグッズ追加モーダル */}
      <CustomTrapModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        customName={customName}
        setCustomName={setCustomName}
        customMonths={customMonths}
        setCustomMonths={setCustomMonths}
        customIcon={customIcon}
        setCustomIcon={setCustomIcon}
        onCreateCustom={handleCreateCustomType}
      />

      {/* ヘッダー */}
      <h1 className="text-xl font-bold border-b pb-2 mb-4 text-slate-900 flex items-center gap-2">
        マイ間取り・防衛グッズ配置
      </h1>

      {/* モード切り替え */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("place")}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold border transition-all ${
            mode === "place" ? "bg-teal-600 text-white border-teal-600 shadow" : "bg-white text-slate-600 border-slate-200"
          }`}
        >
          グッズを配置する (配置モード)
        </button>
        <button
          onClick={() => setMode("edit")}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold border transition-all ${
            mode === "edit" ? "bg-indigo-600 text-white border-indigo-600 shadow" : "bg-white text-slate-600 border-slate-200"
          }`}
        >
          間取りを編集する (編集モード)
        </button>
      </div>

      {/* コントロールパネル */}
      {mode === "place" ? (
        <TrapSelector
          allTrapTypes={allTrapTypes}
          selectedTrapType={selectedTrapType}
          setSelectedTrapType={setSelectedTrapType}
          placedLocation={placedLocation}
          setPlacedLocation={setPlacedLocation}
          placementMonths={placementMonths}
          setPlacementMonths={setPlacementMonths}
          onRequestCustomModal={() => setShowCustomModal(true)}
        />
      ) : (
        <RoomEditor
          houseSize={houseSize}
          setHouseSize={setHouseSize}
          currentFloorName={getFloorName(currentFloor)}
          newRoomName={newRoomName}
          setNewRoomName={setNewRoomName}
          newRoomType={newRoomType}
          setNewRoomType={setNewRoomType}
          onAddRoom={handleAddRoomClick}
        />
      )}

      {/* 🏢 階層＆ズーム管理バー */}
      <FloorSelector
        floors={floors}
        currentFloor={currentFloor}
        setCurrentFloor={setCurrentFloor}
        mode={mode}
        onAddUpperFloor={handleAddUpperFloor}
        onAddLowerFloor={handleAddLowerFloor}
        onDeleteCurrentFloor={handleDeleteCurrentFloor}
        getFloorName={getFloorName}
        zoom={zoom}
        setZoom={setZoom}
      />

      {/* キャンバス外周スクロール枠 */}
      <MapCanvas
        containerRef={containerRef}
        zoom={zoom}
        houseSize={houseSize}
        rooms={rooms}
        traps={traps}
        currentFloor={currentFloor}
        mode={mode}
        onRoomClick={handleRoomClick}
        onRoomPointerDown={handleRoomPointerDown}
        onTrapPointerDown={handleTrapPointerDown}
        onHandlePointerDown={handleHandlePointerDown}
        onTrapClick={handleTrapClick}
        onDeleteRoom={handleDeleteRoomClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
}