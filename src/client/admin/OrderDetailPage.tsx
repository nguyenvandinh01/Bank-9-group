import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Truck } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { OrderDetail } from "../../shared/types";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "../../shared/constants";
import { formatDate, formatVND } from "../lib/format";
import { OrderStatusBadge, PaymentStatusBadge } from "../components/StatusBadge";
import { Alert, PageLoader } from "../components/ui";

const NEXT_STATUS: Record<string, { value: string; label: string }[]> = {
  pending_payment: [],
  pending_confirmation: [
    { value: "paid", label: "Xác nhận đã thanh toán COD" },
    { value: "cancelled", label: "Hủy đơn" },
  ],
  paid: [
    { value: "processing", label: "Bắt đầu xử lý" },
    { value: "shipping", label: "Chuyển sang giao hàng" },
    { value: "cancelled", label: "Hủy đơn" },
  ],
  processing: [
    { value: "shipping", label: "Chuyển sang giao hàng" },
    { value: "cancelled", label: "Hủy đơn" },
  ],
  shipping: [{ value: "completed", label: "Giao hàng thành công" }],
};

export function AdminOrderDetailPage() {
  const { code = "" } = useParams();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin", "order", code],
    queryFn: () => api.get<OrderDetail>(`/api/admin/orders/${encodeURIComponent(code)}`),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "order", code] });
    queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
  };

  const confirmPayment = useMutation({
    mutationFn: () => api.post(`/api/admin/orders/${code}/confirm-payment`),
    onSuccess: () => {
      setError(null);
      setSuccess("Đã xác nhận thanh toán và trừ tồn kho.");
      invalidate();
    },
    onError: (mutationError) => setError(errorMessage(mutationError)),
  });

  const changeStatus = useMutation({
    mutationFn: (status: string) =>
      api.post(`/api/admin/orders/${code}/status`, {
        status,
        note: note.trim() || undefined,
        trackingCode: trackingCode.trim() || undefined,
      }),
    onSuccess: () => {
      setError(null);
      setSuccess("Đã cập nhật trạng thái đơn hàng.");
      setNote("");
      setTrackingCode("");
      invalidate();
    },
    onError: (mutationError) => setError(errorMessage(mutationError)),
  });

  if (isLoading || !order) return <PageLoader />;

  const actions = NEXT_STATUS[order.status] ?? [];
  const canConfirmPayment =
    order.paymentStatus !== "paid" &&
    (order.status === "pending_payment" || order.status === "pending_confirmation");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/admin/don-hang" className="text-sm text-slate-500 hover:text-brand-600">
            ← Danh sách đơn hàng
          </Link>
          <h1 className="mt-1 text-2xl font-black text-slate-900">{order.code}</h1>
          <p className="mt-1 text-sm text-slate-500">Tạo lúc {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      {error ? <Alert>{error}</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="mb-3 font-bold text-slate-900">Sản phẩm</h2>
            <ul className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{item.productName}</p>
                    <p className="text-xs text-slate-500">{item.variantName} · {item.sku}</p>
                    <p className="text-xs text-slate-500">{formatVND(item.unitPrice)} × {item.qty}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatVND(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-bold text-slate-900">Lịch sử trạng thái</h2>
            <ol className="space-y-3">
              {order.history.map((entry, index) => (
                <li key={`${entry.toStatus}-${index}`} className="flex gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                  <div>
                    <p className="font-medium text-slate-800">{ORDER_STATUS_LABELS[entry.toStatus]}</p>
                    <p className="text-xs text-slate-500">{formatDate(entry.createdAt)} · {entry.createdBy}</p>
                    {entry.note ? <p className="text-xs text-slate-500">{entry.note}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="font-bold text-slate-900">Cập nhật trạng thái</h2>

            {canConfirmPayment ? (
              <button
                type="button"
                onClick={() => confirmPayment.mutate()}
                disabled={confirmPayment.isPending}
                className="btn-primary w-full py-3"
              >
                <CheckCircle2 className="h-4 w-4" />
                {confirmPayment.isPending ? "Đang xác nhận..." : "Xác nhận đã thanh toán"}
              </button>
            ) : null}

            {actions.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <label htmlFor="note" className="label">Ghi chú (tùy chọn)</label>
                  <input
                    id="note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="input"
                    placeholder="Ví dụ: Đã gọi xác nhận khách"
                  />
                </div>
                {order.status === "paid" || order.status === "processing" ? (
                  <div>
                    <label htmlFor="tracking" className="label">Mã vận đơn (khi giao hàng)</label>
                    <input
                      id="tracking"
                      value={trackingCode}
                      onChange={(event) => setTrackingCode(event.target.value)}
                      className="input font-mono"
                      placeholder="GHN123456789"
                    />
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <button
                      key={action.value}
                      type="button"
                      onClick={() => changeStatus.mutate(action.value)}
                      disabled={changeStatus.isPending}
                      className={
                        action.value === "cancelled"
                          ? "btn-outline text-rose-600"
                          : "btn-primary"
                      }
                    >
                      {action.value === "shipping" ? <Truck className="h-4 w-4" /> : null}
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Đơn hàng đã ở trạng thái kết thúc.</p>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card space-y-2 p-5 text-sm">
            <h2 className="mb-1 font-bold text-slate-900">Khách hàng</h2>
            <p className="font-medium text-slate-800">{order.customerName}</p>
            <p className="text-slate-600">{order.phone}</p>
            {order.email ? <p className="text-slate-600 break-all">{order.email}</p> : null}
            <p className="pt-2 text-slate-600">{order.address}</p>
            {order.note ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">Ghi chú: {order.note}</p>
            ) : null}
            {order.trackingCode ? (
              <p className="text-xs text-slate-600">Mã vận đơn: <span className="font-mono">{order.trackingCode}</span></p>
            ) : null}
          </section>

          <section className="card space-y-2 p-5 text-sm">
            <h2 className="mb-1 font-bold text-slate-900">Thanh toán</h2>
            <div className="flex justify-between"><span className="text-slate-500">Phương thức</span><span className="font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Trạng thái</span><span className="font-medium">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span></div>
            {order.paidAt ? (
              <div className="flex justify-between"><span className="text-slate-500">Đã TT lúc</span><span className="font-medium">{formatDate(order.paidAt)}</span></div>
            ) : null}
            {order.payment.qrUrl ? (
              <img src={order.payment.qrUrl} alt="VietQR" className="mt-2 w-full rounded-lg border border-slate-200" />
            ) : null}
          </section>

          <section className="card space-y-2 p-5 text-sm">
            <h2 className="mb-1 font-bold text-slate-900">Tổng tiền</h2>
            <div className="flex justify-between"><span className="text-slate-500">Tạm tính</span><span>{formatVND(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Vận chuyển</span><span>{formatVND(order.shippingFee)}</span></div>
            {order.discount > 0 ? (
              <div className="flex justify-between text-emerald-600"><span>Giảm giá {order.couponCode}</span><span>-{formatVND(order.discount)}</span></div>
            ) : null}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold"><span>Tổng</span><span className="text-rose-600">{formatVND(order.total)}</span></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
