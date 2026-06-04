"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const REGION_NAMES: Record<string, string> = {
  hokkaido: "北海道エリア",
  tohoku: "東北エリア",
  kanto: "関東エリア",
  chubu: "中部エリア",
  kinki: "近畿・関西エリア",
  chugoku: "中国エリア",
  shikoku: "四国エリア",
  kyushu: "九州エリア",
  okinawa: "沖縄エリア",
};

export default function RegionBadge() {
  const [locationLabel, setLocationLabel] = useState<string>("位置情報：未取得");

  useEffect(() => {
    // 初回読み込み時にLocalStorageから取得
    const saved = localStorage.getItem("user_region");
    if (saved && REGION_NAMES[saved]) {
      setLocationLabel(REGION_NAMES[saved]);
    }

    // 別の画面で地域が切り替わったことを検知して自動更新するイベント
    const handleRegionChangeEv = () => {
      const latest = localStorage.getItem("user_region");
      if (latest && REGION_NAMES[latest]) {
        setLocationLabel(REGION_NAMES[latest]);
      }
    };

    window.addEventListener("regionChanged", handleRegionChangeEv);
    return () => window.removeEventListener("regionChanged", handleRegionChangeEv);
  }, []);

  return (
    <Link
      href="/register"
      className="text-[11px] bg-white border hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 font-extrabold shadow-sm active:scale-95"
    >
      {locationLabel}
    </Link>
  );
}