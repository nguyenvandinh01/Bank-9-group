import { useEffect, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Copy, ExternalLink } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { OrderDetail } from "../../shared/types";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "../../shared/constants";
import { formatCountdown, formatDate, formatVND } from "../lib/format";
import { OrderStatusBadge, PaymentStatusBadge } from "../components/StatusBadge";
import { Alert, PageLoader } from "../components/ui";
import { cn } from "../lib/cn";

export function OrderPage() {
  const { code = "" } = useParams();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [phone, setPhone] = useState(
    (location.state as { phone?: string } | null)?.phone ?? params.get("phone") ?? "",
  );
  const [submittedPhone, setSubmittedPhone] = useState(
    (location.state as { phone?: string } | null)?.phone ?? params.get("phone") ?? "",
  );
  const [copied, setCopied] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ["order", code, submittedPhone],
    queryFn: () =>
      api.get<OrderDetail>(
        `/api/orders/${encodeURIComponent(code)}?phone=${encodeURIComponent(submittedPhone)}`,
      ),
    enabled: Boolean(code && submittedPhone),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending_payment" || status === "pending_confirmation" ? 15000 : false;
    },
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/api/orders/${code}/cancel`, { phone: submittedPhone }),
    onSuccess: () => refetch(),
  });

  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const submitLookup = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmittedPhone(phone.trim());
    setParams({ phone: phone.trim() }, { replace: true });
  };

  if (!submittedPhone) {
    return (
      <div className="container-page py-12">
        <div className="card mx-auto max-w-md space-y-4 p-6">
          <h1 className="text-xl font-bold text-slate-900">Tra cứu đơn hàng</h1>
          <p className="text-sm text-slate-500">
            Nhập số điện thoại đã dùng khi đặt hàng để xem chi tiết đơn {code}.
          </p>
          <form onSubmit={submitLookup} className="space-y-3">
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="0901234567"
              className="input"
              inputMode="tel"
            />
            <button type="submit" className="btn-primary w-full">Xem đơn hàng</button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) return <PageLoader />;
  if (error || !order) {
    return (
      <div className="container-page py-12">
        <Alert>{errorMessage(error)}</Alert>
        <Link to="/tra-cuu-don" className="btn-primary mt-4">Tra cứu đơn khác</Link>
      </div>
    );
  }

  const canCancel = order.status === "pending_payment" || order.status === "pending_confirmation";
  const isQrPending = order.paymentMethod === "qr" && order.status === "pending_payment";

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Mã đơn hàng</p>
          <h1 className="text-2xl font-black text-slate-900">{order.code}</h1>
          <p className="mt-1 text-sm text-slate-500">Đặt lúc {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      {order.status === "pending_payment" ? (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Clock className="h-4 w-4" />
          Đơn hàng giữ chỗ còn <strong>{formatCountdown(order.expiresAt, now)}</strong>. Vui lòng
          chuyển khoản đúng nội dung để được xác nhận.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {isQrPending && order.payment.qrUrl ? (
            <section className="card p-5">
              <h2 className="mb-4 font-bold text-slate-900">Thanh toán chuyển khoản QR</h2>
              <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
                <img
                  src={order.payment.qrUrl}
                  alt="Mã VietQR thanh toán"
                  className="w-full rounded-xl border border-slate-200"
                />
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Ngân hàng</dt>
                    <dd className="font-semibold">{order.payment.bankName}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Số tài khoản</dt>
                    <dd className="flex items-center gap-1.5 font-mono font-semibold">
                      {order.payment.bankAccount}
                      <button type="button" onClick={() => copy(order.payment.bankAccount, "account")} aria-label="Sao chép số tài khoản">
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Chủ tài khoản</dt>
                    <dd className="font-semibold">{order.payment.bankAccountName}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Số tiền</dt>
                    <dd className="font-semibold text-rose-600">{formatVND(order.total)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Nội dung</dt>
                    <dd className="flex items-center gap-1.5 font-mono font-semibold">
                      {order.code}
                      <button type="button" onClick={() => copy(order.code, "code")} aria-label="Sao chép nội dung">
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    </dd>
                  </div>
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    Đây là QR demo. Cửa hàng sẽ xác nhận thủ công sau khi nhận được chuyển khoản.
                  </p>
                  {copied ? <p className="text-xs font-medium text-emerald-600">Đã sao chép {copied === "code" ? "nội dung" : "số tài khoản"}.</p> : null}
                </dl>
              </div>
            </section>
          ) : null}

          <section className="card p-5">
            <h2 className="mb-4 font-bold text-slate-900">Sản phẩm</h2>
            <ul className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{item.productName}</p>
                    <p className="text-xs text-slate-500">{item.variantName} · {item.sku}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatVND(item.unitPrice)} × {item.qty}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatVND(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-bold text-slate-900">Trạng thái đơn hàng</h2>
            <ol className="space-y-4">
              {order.history.map((entry, index) => (
                <li key={`${entry.toStatus}-${index}`} className="flex gap-3">
                  <span
                    className={cn(
                      "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                      index === order.history.length - 1 ? "bg-brand-500 ring-4 ring-brand-100" : "bg-slate-300",
                    )}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {ORDER_STATUS_LABELS[entry.toStatus]}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(entry.createdAt)} · {entry.createdBy === "system" ? "Hệ thống" : entry.createdBy}
                    </p>
                    {entry.note ? <p className="text-xs text-slate-500">{entry.note}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card space-y-3 p-5">
            <h2 className="font-bold text-slate-900">Thông tin nhận hàng</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Người nhận</dt><dd className="text-right font-medium">{order.customerName}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Điện thoại</dt><dd className="text-right font-medium">{order.phone}</dd></div>
              {order.email ? <div className="flex justify-between gap-3"><dt className="text-slate-500">Email</dt><dd className="text-right font-medium break-all">{order.email}</dd></div> : null}
              <div><dt className="text-slate-500">Địa chỉ</dt><dd className="mt-1 font-medium">{order.address}</dd></div>
              {order.note ? <div><dt className="text-slate-500">Ghi chú</dt><dd className="mt-1">{order.note}</dd></div> : null}
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Thanh toán</dt><dd className="text-right font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Trạng thái TT</dt><dd className="text-right font-medium">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</dd></div>
              {order.trackingCode ? (
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Mã vận đơn</dt><dd className="text-right font-mono font-medium">{order.trackingCode}</dd></div>
              ) : null}
            </dl>
          </section>

          <section className="card space-y-2 p-5 text-sm">
            <h2 className="mb-1 font-bold text-slate-900">Tổng tiền</h2>
            <div className="flex justify-between"><span className="text-slate-500">Tạm tính</span><span>{formatVND(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Vận chuyển</span><span>{order.shippingFee === 0 ? "Miễn phí" : formatVND(order.shippingFee)}</span></div>
            {order.discount > 0 ? (
              <div className="flex justify-between text-emerald-600"><span>Giảm giá {order.couponCode}</span><span>-{formatVND(order.discount)}</span></div>
            ) : null}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold"><span>Tổng</span><span className="text-rose-600">{formatVND(order.total)}</span></div>
          </section>

          {canCancel ? (
            <button
              type="button"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="btn-outline w-full text-rose-600 hover:border-rose-300 hover:text-rose-700"
            >
              {cancelMutation.isPending ? "Đang hủy..." : "Hủy đơn hàng"}
            </button>
          ) : null}

          {cancelMutation.isError ? <Alert>{errorMessage(cancelMutation.error)}</Alert> : null}

          <div className="flex flex-col gap-2">
            <Link to="/tra-cuu-don" className="btn-ghost w-full">
              <ExternalLink className="h-4 w-4" /> Tra cứu đơn khác
            </Link>
            <Link to="/san-pham" className="btn-ghost w-full">
              <CheckCircle2 className="h-4 w-4" /> Tiếp tục mua sắm
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
