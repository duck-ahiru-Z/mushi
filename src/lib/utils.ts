/**
 * 47都道府県の庁所在地データと地域帯の定義
 */
export interface PrefectureData {
  name: string;
  lat: number;
  lon: number;
  region: string; // hokkaido | tohoku | kanto | chubu | kinki | chugoku | shikoku | kyushu | okinawa
}

export const PREFECTURE_COORDINATES: PrefectureData[] = [
  { name: "北海道", lat: 43.06417, lon: 141.34694, region: "hokkaido" },
  { name: "青森県", lat: 40.82444, lon: 140.74, region: "tohoku" },
  { name: "岩手県", lat: 39.70361, lon: 141.1525, region: "tohoku" },
  { name: "宮城県", lat: 38.26889, lon: 140.87194, region: "tohoku" },
  { name: "秋田県", lat: 39.71861, lon: 140.1025, region: "tohoku" },
  { name: "山形県", lat: 38.24056, lon: 140.36333, region: "tohoku" },
  { name: "福島県", lat: 37.75, lon: 140.46778, region: "tohoku" },
  { name: "茨城県", lat: 36.34139, lon: 140.44667, region: "kanto" },
  { name: "栃木県", lat: 36.56583, lon: 139.88361, region: "kanto" },
  { name: "群馬県", lat: 36.39111, lon: 139.06083, region: "kanto" },
  { name: "埼玉県", lat: 35.85694, lon: 139.64889, region: "kanto" },
  { name: "千葉県", lat: 35.60472, lon: 140.12333, region: "kanto" },
  { name: "東京都", lat: 35.68944, lon: 139.69167, region: "kanto" },
  { name: "神奈川県", lat: 35.44778, lon: 139.6425, region: "kanto" },
  { name: "新潟県", lat: 37.90222, lon: 139.02361, region: "chubu" },
  { name: "富山県", lat: 36.69528, lon: 137.21139, region: "chubu" },
  { name: "石川県", lat: 36.59444, lon: 136.62556, region: "chubu" },
  { name: "福井県", lat: 36.06528, lon: 136.22194, region: "chubu" },
  { name: "山梨県", lat: 35.66389, lon: 138.56833, region: "chubu" },
  { name: "長野県", lat: 36.65139, lon: 138.18111, region: "chubu" },
  { name: "岐阜県", lat: 35.39111, lon: 136.72222, region: "chubu" },
  { name: "静岡県", lat: 34.97694, lon: 138.38306, region: "chubu" },
  { name: "愛知県", lat: 35.18028, lon: 136.90667, region: "chubu" },
  { name: "三重県", lat: 34.73028, lon: 136.50861, region: "kinki" },
  { name: "滋賀県", lat: 35.00444, lon: 135.86833, region: "kinki" },
  { name: "京都府", lat: 35.02139, lon: 135.75556, region: "kinki" },
  { name: "大阪府", lat: 34.68639, lon: 135.52, region: "kinki" },
  { name: "兵庫県", lat: 34.69139, lon: 135.18306, region: "kinki" },
  { name: "奈良県", lat: 34.68528, lon: 135.83278, region: "kinki" },
  { name: "和歌山県", lat: 34.22389, lon: 135.1675, region: "kinki" },
  { name: "鳥取県", lat: 35.50361, lon: 134.23833, region: "chugoku" },
  { name: "島根県", lat: 35.47222, lon: 133.05056, region: "chugoku" },
  { name: "岡山県", lat: 34.66167, lon: 133.935, region: "chugoku" },
  { name: "広島県", lat: 34.39639, lon: 132.45944, region: "chugoku" },
  { name: "山口県", lat: 34.18583, lon: 131.47139, region: "chugoku" },
  { name: "徳島県", lat: 34.06583, lon: 134.55944, region: "shikoku" },
  { name: "香川県", lat: 34.34278, lon: 134.04667, region: "shikoku" },
  { name: "愛媛県", lat: 33.84167, lon: 132.76611, region: "shikoku" },
  { name: "高知県", lat: 33.55972, lon: 133.53111, region: "shikoku" },
  { name: "福岡県", lat: 33.60639, lon: 130.41806, region: "kyushu" },
  { name: "佐賀県", lat: 33.24944, lon: 130.29889, region: "kyushu" },
  { name: "長崎県", lat: 32.74472, lon: 129.87361, region: "kyushu" },
  { name: "熊本県", lat: 32.79, lon: 130.74167, region: "kyushu" },
  { name: "大分県", lat: 33.23806, lon: 131.6125, region: "kyushu" },
  { name: "宮崎県", lat: 31.91111, lon: 131.42389, region: "kyushu" },
  { name: "鹿児島県", lat: 31.56028, lon: 130.55806, region: "kyushu" },
  { name: "沖縄県", lat: 26.2125, lon: 127.68111, region: "okinawa" }
];

/**
 * 緯度・経度から日本のおおよその地域区分（防虫気候帯）を自動でマッピングする逆ジオコーディング近似ユーティリティ
 */
export function detectJapanRegion(lat: number, lon: number): string {
  const closestPref = detectPrefecture(lat, lon);
  return closestPref.region;
}

/**
 * 緯度・経度から最も近い日本の都道府県を特定する
 */
export function detectPrefecture(lat: number, lon: number): PrefectureData {
  let minDistance = Infinity;
  let closestPref = PREFECTURE_COORDINATES[0];

  for (const pref of PREFECTURE_COORDINATES) {
    const dLat = pref.lat - lat;
    const dLon = pref.lon - lon;
    const dist = dLat * dLat + dLon * dLon; // 直線距離の二乗
    if (dist < minDistance) {
      minDistance = dist;
      closestPref = pref;
    }
  }

  return closestPref;
}

