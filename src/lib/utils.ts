/**
 * 広域エリア（防虫気候帯）の定義と代表座標
 */
export interface AreaData {
  id: string; // hokkaido | tohoku | kanto | chubu | kinki | chugoku | shikoku | kyushu | okinawa
  name: string; // エリア名
  lat: number;
  lon: number;
}

export const AREA_COORDINATES: AreaData[] = [
  { id: "hokkaido", name: "北海道エリア", lat: 43.06417, lon: 141.34694 },
  { id: "tohoku", name: "東北エリア", lat: 38.26889, lon: 140.87194 },
  { id: "kanto", name: "関東エリア", lat: 35.68944, lon: 139.69167 },
  { id: "chubu", name: "中部エリア", lat: 35.18028, lon: 136.90667 },
  { id: "kinki", name: "近畿・関西エリア", lat: 34.68639, lon: 135.52000 },
  { id: "chugoku", name: "中国エリア", lat: 34.39639, lon: 132.45944 },
  { id: "shikoku", name: "四国エリア", lat: 34.34278, lon: 134.04667 },
  { id: "kyushu", name: "九州エリア", lat: 33.60639, lon: 130.41806 },
  { id: "okinawa", name: "沖縄エリア", lat: 26.21250, lon: 127.68111 }
];

/**
 * 緯度・経度から最も近い広域エリアを特定する
 */
export function detectArea(lat: number, lon: number): AreaData {
  let minDistance = Infinity;
  let closestArea = AREA_COORDINATES[4]; // デフォルトは近畿

  for (const area of AREA_COORDINATES) {
    const dLat = area.lat - lat;
    const dLon = area.lon - lon;
    const dist = dLat * dLat + dLon * dLon; // 直線距離の二乗
    if (dist < minDistance) {
      minDistance = dist;
      closestArea = area;
    }
  }

  return closestArea;
}
