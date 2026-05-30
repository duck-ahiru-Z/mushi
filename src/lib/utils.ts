/**
 * 緯度・経度から日本のおおよその地域区分（防虫気候帯）を自動でマッピングする逆ジオコーディング近似ユーティリティ
 */
export function detectJapanRegion(lat: number, lon: number): string {
  // 1. 沖縄エリア（北緯30度未満の南西諸島）
  if (lat < 30.0) {
    return "okinawa";
  }
  
  // 2. 北海道エリア（北緯41.2度以北）
  if (lat >= 41.2) {
    return "hokkaido";
  }
  
  // 3. 東北エリア（北緯37.0度〜41.2度の間）
  if (lat >= 37.0) {
    return "tohoku";
  }
  
  // 4. 九州エリア（北緯30.0〜33.9度かつ東経132.0度未満）
  if (lat < 33.9 && lon < 132.0) {
    return "kyushu";
  }
  
  // 5. 四国エリア（北緯32.7〜34.3度かつ東経132.0〜134.8度の間で、やや南側）
  if (lat >= 32.5 && lat <= 34.3 && lon >= 132.0 && lon <= 134.8 && lat < 34.0) {
    return "shikoku";
  }
  
  // 6. 中国エリア（本州の西側、東経134.3度未満）
  if (lon < 134.3) {
    return "chugoku";
  }
  
  // 7. 近畿・関西エリア（東経134.3度〜136.0度）
  if (lon >= 134.3 && lon < 136.0) {
    return "kinki";
  }
  
  // 8. 中部エリア（東経136.0度〜138.3度）
  if (lon >= 136.0 && lon < 138.3) {
    return "chubu";
  }
  
  // 9. 関東エリア（東経138.3度以東）
  return "kanto";
}
