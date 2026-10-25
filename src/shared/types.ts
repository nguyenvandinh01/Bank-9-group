import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "./constants";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  productCount?: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  productCount?: number;
}

export interface ProductCard {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  brandName: string;
  brandSlug: string;
  categoryName: string;
  categorySlug: string;
  minPrice: number;
  compareAtPrice: number | null;
  available: number;
  isFeatured: boolean;
}

export interface ProductVariant {
  id: number;
  sku: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  attributes: Record<string, string>;
  imageUrl: string | null;
  available: number;
  isActive: boolean;
}

export interface ProductDetail extends ProductCard {
  description: string;
  specs: Record<string, string>;
  images: { url: string; alt: string }[];
  variants: ProductVariant[];
}

export interface OrderItem {
  id: number;
  productName: string;
  variantName: string;
  sku: string;
  imageUrl: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
}

export interface OrderHistoryEntry {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  createdBy: string;
  createdAt: number;
}

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  qrUrl: string | null;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  paidAt: number | null;
}

export interface OrderDetail {
  code: string;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  note: string | null;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  couponCode: string | null;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  trackingCode: string | null;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  paidAt: number | null;
  items: OrderItem[];
  payment: PaymentInfo;
  history: OrderHistoryEntry[];
}

export interface OrderSummary {
  id: number;
  code: string;
  customerName: string;
  phone: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  itemCount: number;
  createdAt: number;
  expiresAt: number;
}

export interface PublicSettings {
  shopName: string;
  shopHotline: string;
  shopEmail: string;
  shopAddress: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  bankBin: string;
  shippingFee: number;
  freeShippingThreshold: number;
  orderHoldMinutes: number;
}

export interface HomePayload {
  categories: Category[];
  brands: Brand[];
  featured: ProductCard[];
  newest: ProductCard[];
  settings: PublicSettings;
}

export interface ProductListPayload {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminProductSummary extends ProductCard {
  isActive: boolean;
  skuCount: number;
  updatedAt: number;
}

export interface AdminProductDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  categoryId: number;
  brandId: number;
  specs: Record<string, string>;
  isFeatured: boolean;
  isActive: boolean;
  images: { id: number; url: string; alt: string }[];
  variants: {
    id: number;
    sku: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    attributes: Record<string, string>;
    stock: number;
    reserved: number;
    isActive: boolean;
  }[];
}

export interface AdminOrderRow extends OrderSummary {
  paymentStatus: PaymentStatus;
  itemCount: number;
}

export interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  revenue: number;
  todayRevenue: number;
  lowStock: {
    variantId: number;
    sku: string;
    productName: string;
    variantName: string;
    available: number;
  }[];
  recentOrders: AdminOrderRow[];
  statusCounts: { status: OrderStatus; count: number }[];
}

export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: number | null;
  isActive: boolean;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
