"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { Room, Trap } from "@/types/trap";
import { saveTrapData, fetchTraps } from "@/lib/firebase/firestore";

type ExtendedRoom = Room & {
  floor: number;
};

// ユニークなIDを生成するヘルパー関数
const generateId = (prefix: string) => {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
};

export default function MapPage() {
  const [mode, setMode] = useState<"place" | "edit">("place");
  const containerRef = useRef<HTMLDivElement>(null);

  // ハイドレーション＆初期化完了フラグ
  const [isInitialized, setIsInitialized] = useState(false);

  const [floors, setFloors] = useState<number[]>([1, 2]);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [houseSize, setHouseSize] = useState({ width: 600, height: 600 });

  const [dragging, setDragging] = useState<{
    id: string;
    startX: number;
    startY: number;
    roomX: number;
    roomY: number;
    w: number;
    h: number;
  } | null>(null);

  const [rooms, setRooms] = useState<ExtendedRoom[]>([]);
  const [traps, setTraps] = useState<Trap[]>([]);
  const [trapName, setTrapName] = useState<string>("ゴキブリホイホイ");
  const [placedLocation, setPlacedLocation] = useState<string>("🗺️");

  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState("living");

  const getFloorName = (floor: number) => {
    return floor > 0 ? `${floor}F` : `B${Math.abs(floor)}F`;
  };

  // 1. ⏳ ページロード時にローカルストレージとFirebaseから一括復元
  useEffect(() => {
    const initializeData = async () => {
      const savedRooms = localStorage.getItem("map_rooms_data");
      const savedFloors = localStorage.getItem("map_floors_data");
      const savedHouseSize = localStorage.getItem("map_house_size_data");

      if (savedRooms) {
        setRooms(JSON.parse(savedRooms));
      } else {
        setRooms([
          { id: "room-1", name: "キッチン", type: "kitchen", x: 10, y: 10, w: 40, h: 40, floor: 1 },
          { id: "room-2", name: "リビング", type: "living", x: 50, y: 10, w: 40, h: 60, floor: 1 },
        ]);
      }
      if (savedFloors) setFloors(JSON.parse(savedFloors));
      if (savedHouseSize) setHouseSize(JSON.parse(savedHouseSize));

      try {
        const data = await fetchTraps(null);
        setTraps(data);
      } catch (error) {
        console.error("トラップデータの取得に失敗しました:", error);
      }

      // すべてのデータ展開が確実に終わってからフラグを true にする
      setIsInitialized(true);
    };

    initializeData();
  }, []);

  // 2. 💾 初期化が完了した「後」の変更時のみ自動保存が走るように制限
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("map_rooms_data", JSON.stringify(rooms));
      localStorage.setItem("map_floors_data", JSON.stringify(floors));
      localStorage.setItem("map_house_size_data", JSON.stringify(houseSize));
    }
  }, [rooms, floors, houseSize, isInitialized]);

  // 現在の階層の部屋だけを予めフィルタリング（パフォーマンス最適化）
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
    if (floors.length <= 1) {
      alert("これ以上階層を削除することはできません。");
      return;
    }

    const floorName = getFloorName(currentFloor);
    const isConfirmed = confirm(
      `本当に ${floorName} を削除しますか？\n※この階にあるすべての部屋と配置されたグッズも削除されます。`
    );

    if (!isConfirmed) return;

    const targetRoomIds = rooms.filter(r => r.floor === currentFloor).map(r => r.id);

    setFloors(floors.filter(f => f !== currentFloor));
    setRooms(rooms.filter(r => r.floor !== currentFloor));
    setTraps(traps.filter(t => !targetRoomIds.includes(t.roomId || "")));

    const remainingFloors = floors.filter(f => f !== currentFloor);
    setCurrentFloor(remainingFloors[0]);
  };

  const handleAddRoom = () => {
    if (!newRoomName.trim()) return;
    const room: ExtendedRoom = {
      id: generateId("room"), // 安全なID生成
      name: newRoomName,
      type: newRoomType,
      x: 30,
      y: 30,
      w: 30,
      h: 30,
      floor: currentFloor,
    };
    setRooms([...rooms, room]);
    setNewRoomName("");
  };

  const handleDeleteRoom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRooms(rooms.filter((r) => r.id !== id));
    setTraps(traps.filter((t) => t.roomId !== id));
  };

  const handleUpdateRoom = (id: string, field: keyof ExtendedRoom, value: number | string) => {
    setRooms(rooms.map((r) => (r.id === id ? { ...r, [field]: value } : r)) as ExtendedRoom[]);
  };

  // --- ドラッグ&ドロップのハンドラー ---
  const handlePointerDown = (room: ExtendedRoom, e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== "edit") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging({
      id: room.id,
      startX: e.clientX,
      startY: e.clientY,
      roomX: room.x,
      roomY: room.y,
      w: room.w,
      h: room.h,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !containerRef.current) return;
    if (dragging.id !== e.currentTarget.dataset.roomId) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    const deltaX = e.clientX - dragging.startX;
    const deltaY = e.clientY - dragging.startY;

    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;

    let newX = Math.round(dragging.roomX + deltaXPercent);
    let newY = Math.round(dragging.roomY + deltaYPercent);

    newX = Math.max(0, Math.min(100 - dragging.w, newX));
    newY = Math.max(0, Math.min(100 - dragging.h, newY));

    setRooms((prev) =>
      prev.map((r) => (r.id === dragging.id ? { ...r, x: newX, y: newY } : r))
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(null);
  };

  // 部屋クリック時の処理（配置モード時）
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
      id: generateId("trap"), // 安全なID生成
      userId: null,
      name: trapName,
      placedLocation: placedLocation || `${room.name}の隅`,
      roomId: room.id,
      x: clickX,
      y: clickY,
      placedDate: new Date().toISOString().split("T")[0],
      expirationDate: expDate.toISOString().split("T")[0],
      isActive: true,
    };

    // 先にステートを更新（楽観的UIアップデート）
    setTraps((prev) => [...prev, newTrap]);

    try {
      await saveTrapData(newTrap, null);
      alert(`${room.name}に「${trapName}」を配置しました！`);
      setPlacedLocation("");
    } catch (error) {
      console.error("Firebaseへの保存に失敗しました:", error);
      alert("データの保存に失敗しました。もう一度お試しください。");
      // 失敗したら追加したトラップをロールバック（削除）
      setTraps((prev) => prev.filter((t) => t.id !== newTrap.id));
    }
  };

  if (!isInitialized) {
    return <div className="p-4 text-slate-500 text-sm">データを読み込み中...</div>;
  }

  return (
    <div className="p-4 flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <h1 className="text-xl font-bold border-b pb-2 mb-4">🏡 マイ間取り・グッズ配置</h1>

      {/* モード切り替えタブ */}
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
            <select
              value={trapName}
              onChange={(e) => setTrapName(e.target.value)}
              className="w-full p-2 border rounded-lg bg-slate-50 text-sm"
            >
              <option value="ゴキブリホイホイ">ゴキブリホイホイ (期限3ヶ月)</option>
              <option value="ブラックキャップ">ブラックキャップ (期限6ヶ月)</option>
              <option value="ダニよけシート">ダニよけシート (期限2ヶ月)</option>
            </select>
            <input
              type="text"
              placeholder="詳しい場所メモ (例: 冷蔵庫の裏)"
              value={placedLocation}
              onChange={(e) => setPlacedLocation(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm bg-slate-50"
            />
            <p className="text-xs text-slate-400">※下の間取りの、置きたい場所を直接タップして配置します。</p>
          </div>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-slate-100 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-500 mb-2">📐 家全体の大きさ（長さ・px単位）</h2>
            <div className="flex items-center gap-4 text-xs bg-slate-50 p-2 rounded-lg w-fit">
              <label className="flex items-center gap-1">
                横幅:
                <input 
                  type="number" 
                  min="200"
                  step="50"
                  value={houseSize.width} 
                  onChange={(e) => setHouseSize({ ...houseSize, width: Math.max(200, Number(e.target.value)) })} 
                  className="w-16 p-1 border rounded bg-white text-center font-mono" 
                />
                px
              </label>
              <label className="flex items-center gap-1">
                高さ:
                <input 
                  type="number" 
                  min="200"
                  step="50"
                  value={houseSize.height} 
                  onChange={(e) => setHouseSize({ ...houseSize, height: Math.max(200, Number(e.target.value)) })} 
                  className="w-16 p-1 border rounded bg-white text-center font-mono" 
                />
                px
              </label>
              <span className="text-slate-400">※数値を大きくすると、その長さの巨大なキャンバスになります。</span>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 新しい部屋を追加 */}
          <div>
            <h2 className="text-sm font-bold text-slate-500 mb-2">➕ {getFloorName(currentFloor)} に新しい部屋を追加</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="部屋名 (例: 寝室)"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="flex-1 p-2 border rounded-lg text-sm bg-slate-50"
              />
              <button onClick={handleAddRoom} className="px-4 bg-indigo-600 text-white rounded-lg text-sm font-bold">
                追加
              </button>
            </div>
          </div>

          {/* 部屋の微調整 */}
          <div>
            <h2 className="text-sm font-bold text-slate-500 mb-2">⚙️ {getFloorName(currentFloor)} の部屋リスト・数値微調整</h2>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {currentFloorRooms.length === 0 ? (
                <p className="text-xs text-slate-400 p-2">この階にはまだ部屋がありません。</p>
              ) : (
                currentFloorRooms.map((room) => (
                  <div key={room.id} className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 rounded-lg text-xs">
                    <span className="font-bold w-16 truncate">{room.name}</span>
                    <label>X(%):<input type="number" value={room.x} onChange={(e) => handleUpdateRoom(room.id, "x", Number(e.target.value))} className="w-10 p-1 border rounded bg-white ml-1" /></label>
                    <label>Y(%):<input type="number" value={room.y} onChange={(e) => handleUpdateRoom(room.id, "y", Number(e.target.value))} className="w-10 p-1 border rounded bg-white ml-1" /></label>
                    <label>幅(%):<input type="number" value={room.w} onChange={(e) => handleUpdateRoom(room.id, "w", Number(e.target.value))} className="w-10 p-1 border rounded bg-white ml-1" /></label>
                    <label>高(%):<input type="number" value={room.h} onChange={(e) => handleUpdateRoom(room.id, "h", Number(e.target.value))} className="w-10 p-1 border rounded bg-white ml-1" /></label>
                    <button onClick={(e) => handleDeleteRoom(room.id, e)} className="text-red-500 font-bold ml-auto">削除</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🏢 階層管理バー */}
      <div className="flex flex-wrap items-center gap-2 mb-3 bg-slate-100 p-2 rounded-xl">
        <button
          onClick={handleAddLowerFloor}
          className="px-2 py-1 rounded-lg text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition"
          title="現在の最下層の下に、さらに地下を追加します"
        >
          ⬇️ 地下を追加
        </button>

        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 overflow-x-auto max-w-full">
          {floors
            .sort((a, b) => a - b)
            .map((floor) => (
              <button
                key={floor}
                onClick={() => setCurrentFloor(floor)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition shrink-0 ${
                  currentFloor === floor
                    ? "bg-slate-800 text-white shadow-sm"
                    : "bg-transparent text-slate-500 hover:bg-slate-100"
                }`}
              >
                {getFloorName(floor)}
              </button>
            ))}
        </div>

        <button
          onClick={handleAddUpperFloor}
          className="px-2 py-1 rounded-lg text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 transition"
          title="現在の最上層の上に、さらに階を追加します"
        >
          ⬆️ 階を追加
        </button>

        <button
          onClick={handleDeleteCurrentFloor}
          disabled={floors.length <= 1}
          className={`ml-auto px-2 py-1 rounded-lg text-xs font-bold transition ${
            floors.length <= 1 
              ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
              : "bg-red-100 text-red-600 hover:bg-red-200"
          }`}
        >
          🗑️ この階({getFloorName(currentFloor)})を消す
        </button>
      </div>

      {/* キャンバス画面 */}
      <div className="w-full overflow-auto border-2 border-slate-300 bg-slate-200 rounded-2xl p-4 max-h-[75vh] shadow-inner">
        <div 
          ref={containerRef}
          className="relative bg-white rounded-lg border border-slate-300 shadow transition-all duration-200 mx-auto"
          style={{ 
            width: `${houseSize.width}px`, 
            height: `${houseSize.height}px` 
          }}
        >
          {/* フィルタリング済みの部屋をマッピング */}
          {currentFloorRooms.map((room) => (
            <div
              key={room.id}
              data-room-id={room.id}
              onClick={(e) => handleRoomClick(room, e)}
              onPointerDown={(e) => handlePointerDown(room, e)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={`absolute border-2 rounded-lg shadow-sm flex items-center justify-center ${
                mode === "edit"
                  ? "bg-indigo-50 border-indigo-500/40 cursor-move select-none touch-none"
                  : "bg-teal-50 border-teal-600/40 hover:bg-teal-100/70 cursor-crosshair"
              }`}
              style={{ left: `${room.x}%`, top: `${room.y}%`, width: `${room.w}%`, height: `${room.h}%` }}
            >
              <span className={`text-xs font-bold select-none ${mode === "edit" ? "text-indigo-800" : "text-teal-800"}`}>
                {room.name}
              </span>

              {/* トラップの描画 */}
              {traps
                .filter((t) => t.roomId === room.id && t.isActive)
                .map((trap) => (
                  <div
                    key={trap.id}
                    className="absolute w-5 h-5 bg-red-500 border border-white rounded-full flex items-center justify-center text-[10px] text-white shadow handle-bounce"
                    style={{ left: `${trap.x * 100}%`, top: `${trap.y * 100}%`, transform: "translate(-50%, -50%)" }}
                    title={`${trap.name} (${trap.placedLocation})`}
                    onClick={(e) => e.stopPropagation()}
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