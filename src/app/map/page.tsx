"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { Room, Trap } from "@/types/trap";
import { saveTrapData, fetchTraps } from "@/lib/firebase/firestore";

type ExtendedRoom = Room & {
  floor: number;
};

const DEFAULT_ROOMS: ExtendedRoom[] = [
  { id: "room-1", name: "キッチン", type: "kitchen", x: 10, y: 10, w: 35, h: 40, floor: 1 },
  { id: "room-2", name: "リビング", type: "living", x: 50, y: 10, w: 40, h: 60, floor: 1 },
];

const generateId = (prefix: string) => {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
};

type ResizeDirection = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

export default function MapPage() {
  const [mode, setMode] = useState<"place" | "edit">("place");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [floors, setFloors] = useState<number[]>([1, 2]);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  // 表示サイズは固定（必要に応じてここで調整可能）
  const [houseSize] = useState({ width: 600, height: 600 });

  const [dragState, setDragState] = useState<{
    id: string;
    action: "move" | "resize";
    direction?: ResizeDirection;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
  } | null>(null);

  const dragStateRef = useRef(dragState);
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  const [rooms, setRooms] = useState<ExtendedRoom[]>([]);
  const [traps, setTraps] = useState<Trap[]>([]);
  const [trapName, setTrapName] = useState<string>("ゴキブリホイホイ");
  const [placedLocation, setPlacedLocation] = useState<string>("");

  const [newRoomName, setNewRoomName] = useState("");

  const getFloorName = (floor: number) => {
    return floor > 0 ? `${floor}F` : `B${Math.abs(floor)}F`;
  };

  useEffect(() => {
    const initializeData = async () => {
      const savedRooms = localStorage.getItem("map_rooms_data");
      const savedFloors = localStorage.getItem("map_floors_data");

      if (savedRooms) {
        try {
          const parsedRooms = JSON.parse(savedRooms);
          if (Array.isArray(parsedRooms) && parsedRooms.length > 0) {
            setRooms(parsedRooms.map((room: any) => ({ ...room, floor: room.floor || 1 })));
          } else {
            setRooms(DEFAULT_ROOMS);
          }
        } catch (e) {
          setRooms(DEFAULT_ROOMS);
        }
      } else {
        setRooms(DEFAULT_ROOMS);
      }

      if (savedFloors) setFloors(JSON.parse(savedFloors));

      try {
        const data = await fetchTraps(null);
        setTraps(data);
      } catch (error) {
        console.error("データ取得失敗:", error);
      }
      setIsInitialized(true);
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("map_rooms_data", JSON.stringify(rooms));
      localStorage.setItem("map_floors_data", JSON.stringify(floors));
    }
  }, [rooms, floors, isInitialized]);

  useEffect(() => {
    const handleGlobalMove = (e: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state || !containerRef.current) return;

      e.preventDefault();

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      const deltaX = ((e.clientX - state.startX) / rect.width) * 100;
      const deltaY = ((e.clientY - state.startY) / rect.height) * 100;

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
  }, [dragState]);

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

  const handleAddRoom = () => {
    if (!newRoomName.trim()) return;
    const room: ExtendedRoom = {
      id: generateId("room"),
      name: newRoomName,
      type: "living",
      x: 35, y: 35, w: 30, h: 30,
      floor: currentFloor,
    };
    setRooms([...rooms, room]);
    setNewRoomName("");
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

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    let months = 3;
    if (trapName === "ブラックキャップ") months = 6;
    if (trapName === "ダニよけシート") months = 2;

    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + months);

    const newTrap: Trap = {
      id: generateId("trap"),
      userId: null,
      name: trapName,
      placedLocation: placedLocation || `${room.name}の隅`,
      roomId: room.id,
      x: clickX, y: clickY,
      placedDate: new Date().toISOString().split("T")[0],
      expirationDate: expDate.toISOString().split("T")[0],
      isActive: true,
    };

    setTraps((prev) => [...prev, newTrap]);
    try {
      await saveTrapData(newTrap, null);
      alert(`${room.name}に「${trapName}」を配置しました！`);
      setPlacedLocation("");
    } catch (error) {
      alert("データの保存に失敗しました。");
      setTraps((prev) => prev.filter((t) => t.id !== newTrap.id));
    }
  };

  if (!isInitialized) {
    return <div className="p-4 text-slate-500 text-sm">データを読み込み中...</div>;
  }

  return (
    <div className="p-4 flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <h1 className="text-xl font-bold border-b pb-2 mb-4">🏡 マイ間取り・グッズ配置</h1>

      {/* モード切り替え */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("place")}
          className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${
            mode === "place" ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200"
          }`}
        >
          📍 グッズを配置する
        </button>
        <button
          onClick={() => setMode("edit")}
          className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${
            mode === "edit" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200"
          }`}
        >
          🛠️ 間取りを編集する
        </button>
      </div>

      {/* コントロールパネル */}
      {mode === "place" ? (
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-slate-100">
          <h2 className="text-sm font-bold text-slate-500 mb-3">🛠️ 配置するグッズを選択</h2>
          <div className="flex flex-col gap-3">
            <select value={trapName} onChange={(e) => setTrapName(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 text-sm">
              <option value="ゴキブリホイホイ">ゴキブリホイホイ (期限3ヶ月)</option>
              <option value="ブラックキャップ">ブラックキャップ (期限6ヶ月)</option>
              <option value="ダニよけシート">ダニよけシート (期限2ヶ月)</option>
            </select>
            <input type="text" placeholder="詳しい場所メモ (例: 冷蔵庫の裏)" value={placedLocation} onChange={(e) => setPlacedLocation(e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-slate-50" />
          </div>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-slate-100 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-500 mb-2">➕ {getFloorName(currentFloor)} に新しい部屋を追加</h2>
            <div className="flex gap-2">
              <input type="text" placeholder="部屋名 (例: 寝室)" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} className="flex-1 p-2 border rounded-lg text-sm bg-slate-50" />
              <button onClick={handleAddRoom} className="px-4 bg-indigo-600 text-white rounded-lg text-sm font-bold">追加</button>
            </div>
          </div>
        </div>
      )}

      {/* 🏢 階層管理バー */}
      <div className="flex flex-wrap items-center gap-2 mb-3 bg-slate-100 p-2 rounded-xl">
        <button onClick={handleAddLowerFloor} className="px-2 py-1 rounded-lg text-xs font-bold bg-sky-600 text-white">⬇️ 地下</button>
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 overflow-x-auto">
          {floors.sort((a, b) => a - b).map((floor) => (
            <button key={floor} onClick={() => setCurrentFloor(floor)} className={`px-3 py-1 rounded-md text-xs font-bold ${currentFloor === floor ? "bg-slate-800 text-white" : "text-slate-500"}`}>{getFloorName(floor)}</button>
          ))}
        </div>
        <button onClick={handleAddUpperFloor} className="px-2 py-1 rounded-lg text-xs font-bold bg-orange-600 text-white">⬆️ 階追加</button>
      </div>

      {/* キャンバス画面 */}
      <div className="w-full overflow-auto border-2 border-slate-300 bg-slate-200 rounded-2xl p-4 max-h-[75vh]">
        <div 
          ref={containerRef}
          className="relative bg-white rounded-lg border border-slate-300 shadow mx-auto"
          style={{ width: `${houseSize.width}px`, height: `${houseSize.height}px` }}
        >
          {currentFloorRooms.map((room) => (
            <div
              key={room.id}
              onClick={(e) => handleRoomClick(room, e)}
              onPointerDown={(e) => handleRoomPointerDown(room, e)}
              className={`absolute border-2 rounded-lg shadow-sm flex items-center justify-center select-none touch-none ${
                mode === "edit" ? "bg-indigo-50 border-indigo-500/60 cursor-move" : "bg-teal-50 border-teal-600/40 cursor-crosshair"
              }`}
              style={{ left: `${room.x}%`, top: `${room.y}%`, width: `${room.w}%`, height: `${room.h}%`, touchAction: "none" }}
            >
              <span className={`text-xs font-bold select-none pointer-events-none ${mode === "edit" ? "text-indigo-800" : "text-teal-800"}`}>
                {room.name}
              </span>

              {/* リサイズ用の当たり判定エリア群 */}
              {mode === "edit" && (
                <>
                  {/* 四辺 */}
                  <div data-resize-dir="n" onPointerDown={(e) => handleHandlePointerDown(room, "n", e)} className="absolute top-0 left-3 right-3 h-3 cursor-n-resize -top-1.5 bg-transparent" />
                  <div data-resize-dir="s" onPointerDown={(e) => handleHandlePointerDown(room, "s", e)} className="absolute bottom-0 left-3 right-3 h-3 cursor-s-resize -bottom-1.5 bg-transparent" />
                  <div data-resize-dir="e" onPointerDown={(e) => handleHandlePointerDown(room, "e", e)} className="absolute top-3 bottom-3 right-0 w-3 cursor-e-resize -right-1.5 bg-transparent" />
                  <div data-resize-dir="w" onPointerDown={(e) => handleHandlePointerDown(room, "w", e)} className="absolute top-3 bottom-3 left-0 w-3 cursor-w-resize -left-1.5 bg-transparent" />

                  {/* 四隅 */}
                  <div data-resize-dir="nw" onPointerDown={(e) => handleHandlePointerDown(room, "nw", e)} className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize -top-2 -left-2 z-30 bg-transparent" />
                  <div data-resize-dir="ne" onPointerDown={(e) => handleHandlePointerDown(room, "ne", e)} className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize -top-2 -right-2 z-30 bg-transparent" />
                  <div data-resize-dir="sw" onPointerDown={(e) => handleHandlePointerDown(room, "sw", e)} className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize -bottom-2 -left-2 z-30 bg-transparent" />
                  <div data-resize-dir="se" onPointerDown={(e) => handleHandlePointerDown(room, "se", e)} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize -bottom-2 -right-2 z-30 bg-transparent" />
                </>
              )}

              {/* トラップの描画 */}
              {traps
                .filter((t) => t.roomId === room.id && t.isActive)
                .map((trap) => (
                  <div
                    key={trap.id}
                    className="absolute w-5 h-5 bg-red-500 border border-white rounded-full flex items-center justify-center text-[10px] text-white shadow pointer-events-none"
                    style={{ left: `${trap.x * 100}%`, top: `${trap.y * 100}%`, transform: "translate(-50%, -50%)" }}
                  >
                    📍
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}