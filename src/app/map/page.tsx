"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useTraps, ExtendedRoom } from "@/hooks/usetraps";
import { Trap } from "@/types/trap";
import { TrapIcon } from "@/components/vector-icons";

type ResizeDirection = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

export default function MapPage() {
  // グローバル状態管理フックを呼び出す (ゲストモード: null)
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
  } = useTraps(null);

  const [mode, setMode] = useState<"place" | "edit">("place");
  const containerRef = useRef<HTMLDivElement>(null);

  // 📐 ズーム状態（スマホ・PCの画面幅に合わせたデフォルト調整）
  const [zoom, setZoom] = useState(1);

  // マップ表示ベースサイズ
  const [houseSize, setHouseSize] = useState({ width: 600, height: 600 });

  // 🔍 モバイル端末か判定し、デフォルトズームを自動フィットさせる（URLクエリ連動も対応）
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
        // モバイル画面ならデフォルトを 0.6x に縮小してはみ出しを防ぐ！
        setZoom(0.55);
      }

      // クエリパラメータをチェックして、カスタムグッズ登録モーダルを自動表示
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

  // 📱 タッチによるピンチズーム用状態
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

  // プリセットが選択されたらデフォルト有効期間を自動でセット
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

  // 設置グッズの詳細表示（タップ時）
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

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      // 📐 ズーム時のドラッグズレを完全に修正するため、移動量をズーム倍率で除算します！
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
  }, [dragState, zoom]);

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
    // 関連グッズを全削除
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
    // 6秒後に自動でUndoトーストを消去
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
    // 💡 指やマウスでのピン（トラップ）ドラッグ移動を開始
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

  // 🏡 部屋クリック時にグッズを配置
  const handleRoomClick = async (room: ExtendedRoom, e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== "place") return;

    // もしすでに設置済みのトラップアイコン自体をクリックしていたら配置しない
    if ((e.target as HTMLElement).closest(".trap-marker")) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    // 選択されたグッズの有効期限（月数）を取得
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

  // 📍 設置済みグッズのタップ詳細表示
  const handleTrapClick = (trap: Trap, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTrap(trap);
  };

  // 🗑️ グッズ回収（削除）処理
  const handleRemoveTrap = async () => {
    if (!selectedTrap) return;
    try {
      await deleteTrap(selectedTrap.id);
      setSelectedTrap(null);
    } catch {
      alert("グッズの削除に失敗しました。");
    }
  };

  // 🛡️ カスタムグッズの登録処理
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

  // 📱 スマホ用マルチタッチ・ピンチズームジェスチャーのハンドラー
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
      
      {/* ⚠️ Undo 復元トースト通知 */}
      {showUndoToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-slate-700/50 flex items-center gap-3 backdrop-blur-md animate-slide-up">
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
      {selectedTrap && (
        <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-slate-100 flex flex-col gap-4 animate-scale-up">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <TrapIcon id={selectedTrap.name} size={40} />
                </span>
                <div>
                  <h3 className="font-black text-sm text-slate-900">{selectedTrap.name}</h3>
                  <p className="text-[10px] text-slate-400">場所: {selectedTrap.placedLocation}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTrap(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>設置日:</span>
                <strong className="text-slate-700 font-mono">{selectedTrap.placedDate}</strong>
              </div>
              <div className="flex justify-between">
                <span>交換期限:</span>
                <strong className="text-red-600 font-mono">{selectedTrap.expirationDate}</strong>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleRemoveTrap}
                className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
              >
                グッズを回収
              </button>
              <button
                onClick={() => setSelectedTrap(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛡️ オリジナルカスタムグッズ追加モーダル */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-slate-100 flex flex-col gap-4 animate-scale-up">
            <div>
              <h3 className="font-black text-sm text-slate-900">オリジナルグッズの登録</h3>
              <p className="text-[10px] text-slate-400">オリジナルの防虫グッズやスプレーを登録し、間取りに配置して期限管理できます。</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">グッズの名前</label>
                <input
                  type="text"
                  placeholder="例: バルサン置くだけダニシート"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">有効期限（持続月数）</label>
                <select
                  value={customMonths}
                  onChange={(e) => setCustomMonths(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
                >
                  <option value="1">1ヶ月 (例: コバエ用)</option>
                  <option value="2">2ヶ月</option>
                  <option value="3">3ヶ月 (例: 一般ホイホイ)</option>
                  <option value="6">6ヶ月 (例: 毒餌剤)</option>
                  <option value="12">12ヶ月 (1年持続)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">マップ表示アイコン</label>
                <div className="flex gap-2 flex-wrap bg-slate-50 p-2.5 rounded-xl justify-between">
                  {["🪳", "🕷️", "🦟", "🐜", "🌿", "🧴", "📦", "🪙", "🛡️"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCustomIcon(emoji)}
                      className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition border ${
                        customIcon === emoji ? "bg-slate-800 border-slate-800 shadow" : "bg-white hover:bg-slate-100 border-slate-200"
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
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-md"
              >
                登録して選択する
              </button>
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 border border-slate-100 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-extrabold text-slate-400">🛠️ 配置するグッズを選択</h2>
          </div>

          {/*  オリジナルカスタムグッズ作製の大アピールプレミアムボタン */}
          <button
            onClick={() => setShowCustomModal(true)}
            className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 active:scale-[0.98] animate-pulse-subtle"
          >
            <span></span> 自分専用のオリジナル防衛グッズを作製する
          </button>

          <div className="flex flex-col gap-2">
            <select
              value={selectedTrapType}
              onChange={(e) => setSelectedTrapType(e.target.value)}
              className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs font-bold focus:outline-none"
            >
              {allTrapTypes.map((type) => (
                <option key={type.name} value={type.name}>
                  {type.icon} {type.name} (基本: {type.months}ヶ月)
                </option>
              ))}
            </select>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="設置場所メモ (例: 冷蔵庫の裏)"
                  value={placedLocation}
                  onChange={(e) => setPlacedLocation(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 font-medium"
                />
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={placementMonths}
                  onChange={(e) => setPlacementMonths(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2.5 pr-8 border rounded-xl text-xs bg-slate-50 font-black text-center focus:outline-none"
                  title="有効期限を指定した月数で上書きします"
                />
                <span className="absolute right-2.5 text-[9px] font-black text-slate-400 pointer-events-none">ヶ月</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-teal-600 font-bold bg-teal-50/50 p-2 rounded-lg leading-normal">
            <strong>配置方法:</strong> 設置するグッズを選択し、間取り図の配置したい場所をタップしてください。
          </p>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 border border-slate-100 space-y-3">
          <div>
            <h2 className="text-xs font-bold text-slate-400 mb-2">全体のキャンバスサイズ（微調整用）</h2>
            <div className="flex items-center gap-4 text-xs bg-slate-50 p-2 rounded-xl w-fit">
              <label>横幅: <input type="number" min="200" step="50" value={houseSize.width} onChange={(e) => setHouseSize({ ...houseSize, width: Math.max(200, Number(e.target.value)) })} className="w-16 p-1 border rounded bg-white text-center font-mono" /> px</label>
              <label>高さ: <input type="number" min="200" step="50" value={houseSize.height} onChange={(e) => setHouseSize({ ...houseSize, height: Math.max(200, Number(e.target.value)) })} className="w-16 p-1 border rounded bg-white text-center font-mono" /> px</label>
            </div>
          </div>
          <hr className="border-slate-100" />
          <div>
            <h2 className="text-xs font-bold text-slate-400 mb-2">{getFloorName(currentFloor)} に新しい部屋を追加</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="部屋名 (例: トイレ, 脱衣所)"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="flex-1 p-2 border rounded-xl text-xs bg-slate-50 font-bold"
              />
              <button
                onClick={handleAddRoomClick}
                className="px-4 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🏢 階層＆ズーム管理バー */}
      <div className="flex items-center justify-between gap-2 mb-3 bg-slate-100 p-2 rounded-2xl flex-wrap">
        {/* 左: 階数操作 */}
        <div className="flex items-center gap-1.5">
          <button onClick={handleAddLowerFloor} className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-sky-600 hover:bg-sky-700 text-white transition">地下階を追加</button>
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 overflow-x-auto max-w-[150px] sm:max-w-none">
            {floors.sort((a, b) => a - b).map((floor) => (
              <button
                key={floor}
                onClick={() => setCurrentFloor(floor)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                  currentFloor === floor ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {getFloorName(floor)}
              </button>
            ))}
          </div>
          <button onClick={handleAddUpperFloor} className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-orange-600 hover:bg-orange-700 text-white transition">地上階を追加</button>
          
          {mode === "edit" && floors.length > 1 && (
            <button
              onClick={handleDeleteCurrentFloor}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
            >
              この階を削除
            </button>
          )}
        </div>

        {/* 右: ズーム調整ボタン */}
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm ml-auto">
          <span className="text-[10px] font-black text-slate-400 px-1">ズーム:</span>
          <button
            onClick={() => setZoom(Math.max(0.4, Number((zoom - 0.1).toFixed(2))))}
            className="w-6 h-6 flex items-center justify-center bg-slate-50 hover:bg-slate-200 border rounded-lg text-xs font-bold"
          >
            -
          </button>
          <span className="text-[10px] font-black text-slate-700 min-w-[36px] text-center font-mono">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(1.6, Number((zoom + 0.1).toFixed(2))))}
            className="w-6 h-6 flex items-center justify-center bg-slate-50 hover:bg-slate-200 border rounded-lg text-xs font-bold"
          >
            +
          </button>
          <button
            onClick={() => setZoom(window.innerWidth < 640 ? 0.55 : 1)}
            className="text-[9px] font-bold bg-slate-100 hover:bg-slate-200 px-1.5 py-1 rounded border text-slate-500"
          >
            リセット
          </button>
        </div>
      </div>

      {/* キャンバス外周スクロール枠 (ズーム＆マルチタッチピンチジェスチャー対応) */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full overflow-auto border border-slate-300 bg-slate-200/60 rounded-3xl p-4 max-h-[62vh] shadow-inner flex justify-center items-start min-h-[300px]"
      >
        {/* 📐 拡縮を適用するためのコンテナ */}
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
            className="relative bg-white rounded-2xl border border-slate-300 shadow-xl"
            style={{
              width: `${houseSize.width}px`,
              height: `${houseSize.height}px`,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              touchAction: "none",
            }}
          >
            {/* 各部屋の描画 */}
            {currentFloorRooms.map((room) => (
              <div
                key={room.id}
                onClick={(e) => handleRoomClick(room, e)}
                onPointerDown={(e) => handleRoomPointerDown(room, e)}
                className={`absolute border-2 rounded-2xl shadow-sm flex items-center justify-center select-none touch-none ${
                  mode === "edit"
                    ? "bg-indigo-50/80 border-indigo-500/70 cursor-move hover:bg-indigo-50"
                    : "bg-teal-50/50 border-teal-600/30 cursor-crosshair hover:bg-teal-50"
                }`}
                style={{
                  left: `${room.x}%`,
                  top: `${room.y}%`,
                  width: `${room.w}%`,
                  height: `${room.h}%`,
                  touchAction: "none",
                }}
              >
                {/* 部屋名表示（編集モード時は削除ゴミ箱を併記） */}
                <div className="flex flex-col items-center gap-1 pointer-events-none select-none">
                  <span className={`text-[10px] font-black select-none ${mode === "edit" ? "text-indigo-900" : "text-teal-900"}`}>
                    {room.name}
                  </span>
                  {mode === "edit" && (
                    <button
                      onClick={(e) => handleDeleteRoomClick(room.id, room.name, e)}
                      className="pointer-events-auto bg-red-100 hover:bg-red-200 text-red-700 w-10 h-5 flex items-center justify-center rounded-lg text-[9px] font-bold transition z-30"
                      title="この部屋を削除"
                    >
                      削除
                    </button>
                  )}
                </div>

                {/* リサイズ掴み手（編集モード用） */}
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

                {/* 📍 トラップ（グッズ）の描画 */}
                {traps
                  .filter((t) => t.roomId === room.id)
                  .map((trap) => (
                    <button
                      key={trap.id}
                      onClick={(e) => handleTrapClick(trap, e)}
                      onPointerDown={(e) => handleTrapPointerDown(trap, room.id, e)}
                      className="trap-marker absolute w-8 h-8 bg-white border-2 border-teal-500 rounded-full flex items-center justify-center shadow-md hover:scale-125 hover:border-red-500 hover:shadow-lg transition-all active:scale-95 cursor-grab pointer-events-auto z-20"
                      style={{
                        left: `${trap.x * 100}%`,
                        top: `${trap.y * 100}%`,
                        transform: "translate(-50%, -50%)",
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