import { Loader2, ShoppingCart } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-brand-600", className)} />;
}

export function PageLoader({ label = "Đang tải dữ liệu..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-slate-500">
      <Spinner className="h-7 w-7" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        {icon ?? <ShoppingCart className="h-7 w-7" />}
      </div>
      <div className="space-y-1">
        <p className="text-lg font-bold text-slate-900">{title}</p>
        {description ? <p className="max-w-md text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-2 h-5 w-1/2" />
      </div>
    </div>
  );
}

export function Alert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const tones = {
    error: "border-rose-200 bg-rose-50 text-rose-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-sky-200 bg-sky-50 text-sky-700",
  };
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", tones[tone])} role="alert">
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
