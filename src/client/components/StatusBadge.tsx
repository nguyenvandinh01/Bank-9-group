import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "../../shared/constants";
import { cn } from "../lib/cn";

const TONES: Record<string, string> = {
  amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  blue: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  violet: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  slate: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  rose: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("badge", TONES[ORDER_STATUS_TONES[status]] ?? TONES.slate)}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone = status === "paid" ? TONES.emerald : status === "refunded" ? TONES.violet : TONES.amber;
  return <span className={cn("badge", tone)}>{PAYMENT_STATUS_LABELS[status]}</span>;
}
