"use client";

import { Trap } from "@/types/trap";
import { TrapIcon } from "@/components/vector-icons";

interface TrapDetailModalProps {
  trap: Trap | null;
  onClose: () => void;
  onRemove: () => void;
}

export function TrapDetailModal({
  trap,
  onClose,
  onRemove,
}: TrapDetailModalProps) {
  if (!trap) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-md shadow-lg p-5 border border-slate-200 flex flex-col gap-4 text-slate-800">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-slate-100 rounded-md flex items-center justify-center flex-shrink-0 border border-slate-200">
              <TrapIcon id={trap.name} size={40} />
            </span>
            <div>
              <h3 className="font-bold text-sm text-slate-900">{trap.name}</h3>
              <p className="text-[10px] text-slate-400">場所: {trap.placedLocation}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-450 hover:text-slate-600 text-lg font-bold">×</button>
        </div>
        
        <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-1.5 text-xs text-slate-500">
          <div className="flex justify-between">
            <span>設置日:</span>
            <strong className="text-slate-700 font-mono">{trap.placedDate}</strong>
          </div>
          <div className="flex justify-between">
            <span>交換期限:</span>
            <strong className="text-red-750 font-mono">{trap.expirationDate}</strong>
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={onRemove}
            className="flex-1 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-md text-xs font-bold transition flex items-center justify-center gap-1 active:scale-[0.98]"
          >
            グッズを回収
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-bold transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
