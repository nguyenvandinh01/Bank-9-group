import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import type { PublicSettings } from "../../shared/types";
import { useCart, cartSubtotal } from "../store/cart";
import { formatVND } from "../lib/format";
import { EmptyState } from "../components/ui";

export function CartPage() {
  const items = useCart((state) => state.items);
  const setQty = useCart((state) => state.setQty);
  const removeItem = useCart((state) => state.removeItem);
  const navigate = useNavigate();

  const { data: settings } = useQuery({
    queryKey: ["settings", "public"],
    queryFn: () => api.get<PublicSettings>("/api/settings/public"),
    staleTime: 5 * 60 * 1000,
  });

  const subtotal = cartSubtotal(items);
  const shippingFee =
    items.length === 0
      ? 0
      : subtotal >= (settings?.freeShippingThreshold ?? 5000000)
        ? 0
        : (settings?.shippingFee ?? 30000);
  const total = subtotal + shippingFee;

  if (items.length === 0) {
    return (
      <div className="container-page py-12">
        <EmptyState
          title="Giỏ hàng đang trống"
          description="Khám phá các sản phẩm công nghệ mới nhất và thêm vào giỏ hàng của bạn."
          action={
            <Link to="/san-pham" className="btn-primary mt-2">
              Tiếp tục mua sắm
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Giỏ hàng của bạn</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.variantId} className="card flex gap-4 p-4">
              <Link to={`/san-pham/${item.productSlug}`} className="shrink-0">
                <div className="h-24 w-24 overflow-hidden rounded-xl bg-slate-100">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                  ) : null}
                </div>
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  to={`/san-pham/${item.productSlug}`}
                  className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-brand-600"
                >
                  {item.productName}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">
                  {item.variantName} · SKU {item.sku}
                </p>
                <p className="mt-1 text-sm font-bold text-rose-600">{formatVND(item.price)}</p>

                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  <div className="inline-flex items-center rounded-lg border border-slate-300">
                    <button
                      type="button"
                      className="px-2.5 py-1.5 text-slate-500 hover:text-slate-900"
                      onClick={() => setQty(item.variantId, item.qty - 1)}
                      aria-label="Giảm"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-9 text-center text-sm font-semibold">{item.qty}</span>
                    <button
                      type="button"
                      className="px-2.5 py-1.5 text-slate-500 hover:text-slate-900"
                      onClick={() => setQty(item.variantId, item.qty + 1)}
                      aria-label="Tăng"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-800">
                      {formatVND(item.price * item.qty)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Xóa sản phẩm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="card h-fit space-y-3 p-5">
          <h2 className="text-lg font-bold text-slate-900">Tóm tắt đơn hàng</h2>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Tạm tính</span>
            <span className="font-medium">{formatVND(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Phí vận chuyển</span>
            <span className="font-medium">
              {shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}
            </span>
          </div>
          {shippingFee > 0 ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Mua thêm {formatVND((settings?.freeShippingThreshold ?? 5000000) - subtotal)} để được miễn phí ship.
            </p>
          ) : null}
          <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
            <span className="font-semibold">Tổng cộng</span>
            <span className="font-black text-rose-600">{formatVND(total)}</span>
          </div>
          <button type="button" onClick={() => navigate("/thanh-toan")} className="btn-primary w-full py-3">
            Tiến hành thanh toán
          </button>
          <Link to="/san-pham" className="btn-ghost w-full">Tiếp tục mua sắm</Link>
        </aside>
      </div>
    </div>
  );
}
