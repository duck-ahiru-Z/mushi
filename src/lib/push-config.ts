import fs from "fs";
import path from "path";
import webpush from "web-push";

const KEYS_FILE = path.join(process.cwd(), "vapid-keys.json");

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

export function getOrGenerateVapidKeys(): VapidKeys {
  // 1. デプロイ環境用：環境変数があれば最優先で取得（Vercel等の本番サーバーで安定稼働させるために必須）
  const envPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const envPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (envPublicKey && envPrivateKey) {
    return {
      publicKey: envPublicKey,
      privateKey: envPrivateKey
    };
  }

  // 2. ローカル開発環境用：ファイルがあれば読み込む
  if (fs.existsSync(KEYS_FILE)) {
    try {
      const data = fs.readFileSync(KEYS_FILE, "utf-8");
      return JSON.parse(data) as VapidKeys;
    } catch (err) {
      console.error("Failed to read VAPID keys file, generating new ones:", err);
    }
  }

  // 3. ローカル開発環境用：ファイルがなければ新規生成して保存
  const keys = webpush.generateVAPIDKeys();
  try {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), "utf-8");
    console.log("G-End: Successfully generated and persisted new VAPID keys in", KEYS_FILE);
  } catch (err) {
    console.error("Failed to save VAPID keys file:", err);
  }

  return keys;
}

// Configure web-push with VAPID keys
export function configureWebPush() {
  const keys = getOrGenerateVapidKeys();
  webpush.setVapidDetails(
    "mailto:test-g-end@example.com",
    keys.publicKey,
    keys.privateKey
  );
  return keys;
}
