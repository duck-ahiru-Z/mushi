// components/layouts/region-badge.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { detectArea } from "@/lib/utils";

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

  // 地域設定の読み込み＆自動位置情報取得
  const loadUserRegionAndDetect = () => {
    const saved = localStorage.getItem("user_region");
    if (saved) {
      setLocationLabel(REGION_NAMES[saved]);
      return;
    }
    requestGeoPermission();
  };

  const requestGeoPermission = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const closestArea = detectArea(lat, lon);
          
          localStorage.setItem("user_region", closestArea.id);
          setLocationLabel(`${REGION_NAMES[closestArea.id]} (GPS自動判定)`);
          
          // 他のコンポーネント（HomePageなど）に地域が変わったことを通知する
          window.dispatchEvent(new Event("regionChanged"));
        },
        (error) => {
          console.warn("Geolocation error, using default region:", error);
          setLocationLabel("近畿・関西エリア (デフォルト)");
        }
      );
    }
  };

  useEffect(() => {
    loadUserRegionAndDetect();

    // 他の画面で地域が変更されたときにもヘッダーの表示を連動させる
    const handleRegionChangeEv = () => {
      const saved = localStorage.getItem("user_region");
      if (saved) {
        setLocationLabel(REGION_NAMES[saved]);
      }
    };

    window.addEventListener("regionChanged", handleRegionChangeEv);
    return () => window.removeEventListener("regionChanged", handleRegionChangeEv);
  }, []);

  return (
    <Link
      href="/register"
      className="text-[10px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 font-bold shadow-sm ml-2 whitespace-nowrap"
    >
      {locationLabel}
    </Link>
  );
}