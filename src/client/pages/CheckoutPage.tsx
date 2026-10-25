import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { QrCode, Truck } from "lucide-react";
import { api, ApiError, errorMessage } from "../lib/api";
import type { PublicSettings } from "../../shared/types";
import { checkoutSchema } from "../../shared/schemas";
import { useCart, cartSubtotal } from "../store/cart";
import { formatVND } from "../lib/format";
import { Alert } from "../components/ui";
import { cn } from "../lib/cn";

interface FieldErrors {
  [key: string]: string | undefined;
}

function createIdempotencyKey(): string {
  return `co-${Date.now().toString(36)}-${crypto.randomUUID()}`;
}

export function CheckoutPage() {
  const items = useCart((state) => state.items);
  const clear = useCart((state) => state.clear);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    note: "",
    couponCode: "",
    paymentMethod: "qr" as "qr" | "cod",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [idempotencyKey] = useState(createIdempotencyKey);

  const { data: settings } = useQuery({
    queryKey: ["settings", "public"],
    queryFn: () => api.get<PublicSettings>("/api/settings/public"),
    staleTime: 5 * 60 * 1000,
  });

  const subtotal = cartSubtotal(items);
  const shippingFee =
    subtotal >= (settings?.freeShippingThreshold ?? 5000000) ? 0 : (settings?.shippingFee ?? 30000);
  const estimatedTotal = subtotal + shippingFee;

  const mutation = useMutation({
    mutationFn: (payload: unknown) =>
      api.post<{ code: string }>("/api/checkout", payload, {
        "Idempotency-Key": idempotencyKey,
      }),
    onSuccess: (result) => {
      clear();
      navigate(`/don-hang/${result.code}`, {
        replace: true,
        state: { phone: form.phone },
      });
    },
    onError: (error) => {
      setSubmitError(errorMessage(error));
      if (error instanceof ApiError && error.code === "OUT_OF_STOCK") {
        navigate("/gio-hang");
      }
    },
  });

  const total = useMemo(() => estimatedTotal, [estimatedTotal]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const parsed = checkoutSchema.safeParse({
      customerName: form.customerName,
      phone: form.phone,
      email: form.email,
      address: form.address,
      note: form.note,
      paymentMethod: form.paymentMethod,
      couponCode: form.couponCode || undefined,
      items: items.map((item) => ({ variantId: item.variantId, qty: item.qty })),
    });

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        if (!nextErrors[path]) nextErrors[path] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    mutation.mutate(parsed.data);
  };

  if (items.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-lg font-semibold text-slate-800">Giỏ hàng đang trống</p>
        <Link to="/san-pham" className="btn-primary mt-4">Chọn sản phẩm</Link>
      </div>
    );
  }

  const field = (name: keyof typeof form, label: string, placeholder = "", type = "text") => (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <input
        id={name}
        type={type}
        value={form[name]}
        onChange={(event) => setForm((value) => ({ ...value, [name]: event.target.value }))}
        placeholder={placeholder}
        className={cn("input", errors[name] && "border-rose-400")}
      />
      {errors[name] ? <p className="mt-1 text-xs text-rose-600">{errors[name]}</p> : null}
    </div>
  );

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Thanh toán</h1>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section className="card space-y-4 p-5">
            <h2 className="font-bold text-slate-900">Thông tin giao hàng</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("customerName", "Họ và tên *", "Nguyễn Văn An")}
              {field("phone", "Số điện thoại *", "0901234567", "tel")}
            </div>
            {field("email", "Email (tùy chọn)", "an@example.com", "email")}
            <div>
              <label htmlFor="address" className="label">Địa chỉ nhận hàng *</label>
              <textarea
                id="address"
                rows={3}
                value={form.address}
                onChange={(event) => setForm((value) => ({ ...value, address: event.target.value }))}
                placeholder="Số nhà, đường, phường, quận, tỉnh/thành"
                className={cn("input resize-none", errors.address && "border-rose-400")}
              />
              {errors.address ? <p className="mt-1 text-xs text-rose-600">{errors.address}</p> : null}
            </div>
            <div>
              <label htmlFor="note" className="label">Ghi chú (tùy chọn)</label>
              <textarea
                id="note"
                rows={2}
                value={form.note}
                onChange={(event) => setForm((value) => ({ ...value, note: event.target.value }))}
                placeholder="Ví dụ: giao giờ hành chính"
                className="input resize-none"
              />
            </div>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="font-bold text-slate-900">Phương thức thanh toán</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setForm((value) => ({ ...value, paymentMethod: "qr" }))}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 text-left",
                  form.paymentMethod === "qr"
                    ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                    : "border-slate-200",
                )}
              >
                <QrCode className="mt-0.5 h-5 w-5 text-brand-600" />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Chuyển khoản QR</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Quét VietQR, cửa hàng xác nhận thanh toán
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setForm((value) => ({ ...value, paymentMethod: "cod" }))}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 text-left",
                  form.paymentMethod === "cod"
                    ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                    : "border-slate-200",
                )}
              >
                <Truck className="mt-0.5 h-5 w-5 text-brand-600" />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Thanh toán khi nhận hàng</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    COD, thanh toán cho nhân viên giao hàng
                  </span>
                </span>
              </button>
            </div>
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="font-bold text-slate-900">Mã giảm giá</h2>
            <input
              value={form.couponCode}
              onChange={(event) => setForm((value) => ({ ...value, couponCode: event.target.value.toUpperCase() }))}
              placeholder="Nhập mã, ví dụ WELCOME10"
              className="input"
            />
            <p className="text-xs text-slate-500">
              Mã hợp lệ sẽ được kiểm tra và áp dụng khi tạo đơn hàng.
            </p>
            {submitError ? <Alert>{submitError}</Alert> : null}
          </section>
        </div>

        <aside className="card h-fit space-y-3 p-5">
          <h2 className="text-lg font-bold text-slate-900">Đơn hàng của bạn</h2>
          <ul className="max-h-64 space-y-3 overflow-auto">
            {items.map((item) => (
              <li key={item.variantId} className="flex gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="line-clamp-2 font-medium text-slate-800">{item.productName}</p>
                  <p className="text-xs text-slate-500">{item.variantName} × {item.qty}</p>
                </div>
                <p className="text-sm font-semibold">{formatVND(item.price * item.qty)}</p>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-slate-200 pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Tạm tính</span>
              <span>{formatVND(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phí vận chuyển</span>
              <span>{shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
              <span>Tổng cộng</span>
              <span className="text-rose-600">{formatVND(total)}</span>
            </div>
            <p className="text-xs text-slate-500">Giảm giá (nếu có) được áp dụng khi tạo đơn.</p>
          </div>
          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3">
            {mutation.isPending ? "Đang tạo đơn..." : "Đặt hàng"}
          </button>
          <Link to="/gio-hang" className="btn-ghost w-full">Quay lại giỏ hàng</Link>
        </aside>
      </form>
    </div>
  );
}
