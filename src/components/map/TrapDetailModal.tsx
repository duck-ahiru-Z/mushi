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
    <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-slate-100 flex flex-col gap-4 animate-scale-up text-slate-800">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <TrapIcon id={trap.name} size={40} />
            </span>
            <div>
              <h3 className="font-black text-sm text-slate-900">{trap.name}</h3>
              <p className="text-[10px] text-slate-400">場所: {trap.placedLocation}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
        </div>
        
        <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-500">
          <div className="flex justify-between">
            <span>設置日:</span>
            <strong className="text-slate-700 font-mono">{trap.placedDate}</strong>
          </div>
          <div className="flex justify-between">
            <span>交換期限:</span>
            <strong className="text-red-600 font-mono">{trap.expirationDate}</strong>
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={onRemove}
            className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 active:scale-[0.98]"
          >
            グッズを回収
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
