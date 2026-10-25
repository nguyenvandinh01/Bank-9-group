import { z } from "zod";

export const checkoutItemSchema = z.object({
  variantId: z.number().int().positive(),
  qty: z.number().int().min(1).max(10),
});

export const checkoutSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Vui lòng nhập họ tên")
    .max(60, "Họ tên quá dài"),
  phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)(\d{9})$/, "Số điện thoại không hợp lệ"),
  email: z
    .union([z.string().trim().email("Email không hợp lệ"), z.literal("")])
    .optional(),
  address: z
    .string()
    .trim()
    .min(10, "Vui lòng nhập địa chỉ chi tiết")
    .max(200, "Địa chỉ quá dài"),
  note: z.string().trim().max(300, "Ghi chú quá dài").optional(),
  paymentMethod: z.enum(["qr", "cod"]),
  couponCode: z.string().trim().max(30).optional(),
  items: z.array(checkoutItemSchema).min(1, "Giỏ hàng đang trống").max(20),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const adminLoginSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const variantInputSchema = z.object({
  id: z.number().int().positive().optional(),
  sku: z.string().trim().min(2, "SKU quá ngắn").max(40),
  name: z.string().trim().min(1, "Vui lòng nhập tên phiên bản").max(80),
  price: z.number().int().min(0, "Giá không hợp lệ"),
  compareAtPrice: z.number().int().min(0).nullable().optional(),
  stock: z.number().int().min(0, "Tồn kho không hợp lệ"),
  attributes: z.record(z.string(), z.string()).optional(),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập tên sản phẩm").max(160),
  slug: z.string().trim().max(160).optional(),
  description: z.string().trim().max(4000).optional(),
  categoryId: z.number().int().positive("Chọn danh mục"),
  brandId: z.number().int().positive("Chọn thương hiệu"),
  specs: z.record(z.string(), z.string()).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  images: z.array(z.string().trim().min(1)).max(8).optional(),
  variants: z.array(variantInputSchema).min(1, "Cần ít nhất một phiên bản"),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const settingsInputSchema = z.object({
  shop_name: z.string().trim().min(1).max(80),
  shop_hotline: z.string().trim().max(30),
  shop_email: z.string().trim().max(80),
  shop_address: z.string().trim().max(200),
  bank_name: z.string().trim().min(1).max(60),
  bank_bin: z.string().trim().regex(/^\d{6}$/, "BIN phải gồm 6 chữ số"),
  bank_account: z.string().trim().min(4).max(30),
  bank_account_name: z.string().trim().min(2).max(80),
  shipping_fee: z.string().trim().regex(/^\d+$/),
  free_shipping_threshold: z.string().trim().regex(/^\d+$/),
  order_hold_minutes: z.string().trim().regex(/^\d+$/),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(300).optional(),
});

export const brandInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().max(80).optional(),
});

export const couponInputSchema = z.object({
  code: z.string().trim().min(2).max(30),
  description: z.string().trim().max(200).optional(),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.number().int().min(1),
  minOrder: z.number().int().min(0).optional(),
  maxDiscount: z.number().int().min(0).nullable().optional(),
  usageLimit: z.number().int().min(0).nullable().optional(),
  expiresAt: z.number().int().nullable().optional(),
  isActive: z.boolean().optional(),
});
