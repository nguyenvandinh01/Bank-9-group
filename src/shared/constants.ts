export const ORDER_STATUSES = [
  "pending_payment",
  "pending_confirmation",
  "paid",
  "processing",
  "shipping",
  "completed",
  "cancelled",
  "expired",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["qr", "cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Chờ thanh toán",
  pending_confirmation: "Chờ xác nhận COD",
  paid: "Đã thanh toán",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  qr: "Chuyển khoản QR",
  cod: "Thanh toán khi nhận hàng",
};

export const ORDER_STATUS_TONES: Record<OrderStatus, string> = {
  pending_payment: "amber",
  pending_confirmation: "amber",
  paid: "blue",
  processing: "blue",
  shipping: "violet",
  completed: "emerald",
  cancelled: "slate",
  expired: "rose",
};

export const DEFAULT_SETTINGS = {
  shop_name: "Bank9 Tech",
  shop_hotline: "1900 0009",
  shop_email: "cskh@bank9.local",
  shop_address: "123 Nguyễn Văn Linh, Quận 7, TP.HCM",
  bank_name: "Vietcombank",
  bank_bin: "970436",
  bank_account: "0123456789",
  bank_account_name: "NGUYEN VAN A",
  shipping_fee: "30000",
  free_shipping_threshold: "5000000",
  order_hold_minutes: "30",
} as const;

export const SPEC_LABELS: Record<string, string> = {
  screen: "Màn hình",
  cpu: "CPU",
  ram: "RAM",
  storage: "Lưu trữ",
  camera: "Camera",
  battery: "Pin",
  os: "Hệ điều hành",
  weight: "Khối lượng",
  gpu: "GPU",
  warranty: "Bảo hành",
  ports: "Cổng kết nối",
  color: "Màu sắc",
};

export function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(value)) + " ₫";
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length === 11) return "0" + digits.slice(2);
  if (digits.startsWith("0")) return digits;
  return digits;
}

export function normalizeSearch(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(input: string): string {
  return normalizeSearch(input).replace(/\s+/g, "-").replace(/-+/g, "-");
}

export function buildVietQrUrl(params: {
  bin: string;
  account: string;
  amount: number;
  addInfo: string;
  accountName: string;
}): string {
  const query = new URLSearchParams({
    amount: String(Math.round(params.amount)),
    addInfo: params.addInfo,
    accountName: params.accountName,
  });
  return `https://img.vietqr.io/image/${params.bin}-${params.account}-compact2.png?${query.toString()}`;
}
