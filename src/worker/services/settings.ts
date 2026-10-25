import type { AppEnv } from "../env";

export interface Settings {
  shopName: string;
  shopHotline: string;
  shopEmail: string;
  shopAddress: string;
  bankName: string;
  bankBin: string;
  bankAccount: string;
  bankAccountName: string;
  shippingFee: number;
  freeShippingThreshold: number;
  orderHoldMinutes: number;
}

const FALLBACK: Settings = {
  shopName: "Bank9 Tech",
  shopHotline: "1900 0009",
  shopEmail: "cskh@bank9.local",
  shopAddress: "123 Nguyễn Văn Linh, Quận 7, TP.HCM",
  bankName: "Vietcombank",
  bankBin: "970436",
  bankAccount: "0123456789",
  bankAccountName: "NGUYEN VAN A",
  shippingFee: 30000,
  freeShippingThreshold: 5000000,
  orderHoldMinutes: 30,
};

function toInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function getSettings(db: D1Database): Promise<Settings> {
  const rows = await db
    .prepare("SELECT key, value FROM settings")
    .all<{ key: string; value: string }>();
  const map = new Map((rows.results ?? []).map((row) => [row.key, row.value]));

  return {
    shopName: map.get("shop_name") ?? FALLBACK.shopName,
    shopHotline: map.get("shop_hotline") ?? FALLBACK.shopHotline,
    shopEmail: map.get("shop_email") ?? FALLBACK.shopEmail,
    shopAddress: map.get("shop_address") ?? FALLBACK.shopAddress,
    bankName: map.get("bank_name") ?? FALLBACK.bankName,
    bankBin: map.get("bank_bin") ?? FALLBACK.bankBin,
    bankAccount: map.get("bank_account") ?? FALLBACK.bankAccount,
    bankAccountName: map.get("bank_account_name") ?? FALLBACK.bankAccountName,
    shippingFee: toInt(map.get("shipping_fee"), FALLBACK.shippingFee),
    freeShippingThreshold: toInt(
      map.get("free_shipping_threshold"),
      FALLBACK.freeShippingThreshold,
    ),
    orderHoldMinutes: toInt(
      map.get("order_hold_minutes"),
      FALLBACK.orderHoldMinutes,
    ),
  };
}

export async function saveSettings(
  db: D1Database,
  values: Record<string, string>,
  now: number,
): Promise<void> {
  const statements = Object.entries(values).map(([key, value]) =>
    db
      .prepare(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      )
      .bind(key, value, now),
  );
  if (statements.length > 0) {
    await db.batch(statements);
  }
}

export function publicSettings(settings: Settings) {
  return {
    shopName: settings.shopName,
    shopHotline: settings.shopHotline,
    shopEmail: settings.shopEmail,
    shopAddress: settings.shopAddress,
    bankName: settings.bankName,
    bankAccount: settings.bankAccount,
    bankAccountName: settings.bankAccountName,
    bankBin: settings.bankBin,
    shippingFee: settings.shippingFee,
    freeShippingThreshold: settings.freeShippingThreshold,
    orderHoldMinutes: settings.orderHoldMinutes,
  };
}

export async function readEnvSettings(env: AppEnv): Promise<Settings> {
  const settings = await getSettings(env.DB);
  return {
    ...settings,
    shopName: env.SHOP_NAME || settings.shopName,
    orderHoldMinutes: toInt(env.ORDER_HOLD_MINUTES, settings.orderHoldMinutes),
  };
}
