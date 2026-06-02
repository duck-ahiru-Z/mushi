"use client";

interface RegionSettingsProps {
  region: string;
  onRegionChange: (newRegion: string) => void;
}

const REGIONS = [
  { id: "hokkaido", name: "北海道エリア" },
  { id: "tohoku", name: "東北エリア" },
  { id: "kanto", name: "関東エリア" },
  { id: "chubu", name: "中部エリア" },
  { id: "kinki", name: "近畿・関西エリア (デフォルト)" },
  { id: "chugoku", name: "中国エリア" },
  { id: "shikoku", name: "四国エリア" },
  { id: "kyushu", name: "九州エリア" },
  { id: "okinawa", name: "沖縄エリア" },
];

export function RegionSettings({ region, onRegionChange }: RegionSettingsProps) {
  return (
    <div className="bg-white p-5 rounded-md border border-slate-200 mb-6">
      <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
        警報・予報用の地域設定
      </h2>
      <p className="text-xs text-slate-400 mb-3 leading-relaxed">
        指定した地域の気候データに基づき、ホーム画面のアラートや対策図鑑の表示順が自動で最適化されます。
      </p>
      <div className="relative">
        <select
          value={region}
          onChange={(e) => onRegionChange(e.target.value)}
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-700 appearance-none text-slate-800"
        >
          {REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
          ▼
        </div>
      </div>
    </div>
  );
}
