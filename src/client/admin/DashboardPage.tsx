import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Banknote, ShoppingBag, Wallet } from "lucide-react";
import { api } from "../lib/api";
import type { AdminStats } from "../../shared/types";
import { ORDER_STATUS_LABELS } from "../../shared/constants";
import { formatDate, formatVND } from "../lib/format";
import { OrderStatusBadge, PaymentStatusBadge } from "../components/StatusBadge";
import { PageLoader } from "../components/ui";

export function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get<AdminStats>("/api/admin/stats"),
  });

  if (isLoading || !data) return <PageLoader />;

  const cards = [
    { label: "Tổng đơn hàng", value: String(data.totalOrders), icon: ShoppingBag, tone: "bg-sky-50 text-sky-600" },
    { label: "Chờ xử lý", value: String(data.pendingOrders), icon: AlertTriangle, tone: "bg-amber-50 text-amber-600" },
    { label: "Doanh thu (đã TT)", value: formatVND(data.revenue), icon: Banknote, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Doanh thu hôm nay", value: formatVND(data.todayRevenue), icon: Wallet, tone: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tổng quan</h1>
        <p className="mt-1 text-sm text-slate-500">Theo dõi đơn hàng và tồn kho của cửa hàng.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card flex items-center gap-4 p-5">
            <span className={`grid h-12 w-12 place-items-center rounded-xl ${card.tone}`}>
              <card.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="text-xl font-bold text-slate-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-900">Đơn hàng gần đây</h2>
            <Link to="/admin/don-hang" className="text-sm font-semibold text-brand-600">Xem tất cả</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Mã đơn</th>
                  <th className="px-5 py-3">Khách hàng</th>
                  <th className="px-5 py-3">Tổng tiền</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link to={`/admin/don-hang/${order.code}`} className="font-mono font-semibold text-brand-600">
                        {order.code}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{order.customerName}</p>
                      <p className="text-xs text-slate-500">{order.phone}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold">{formatVND(order.total)}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <OrderStatusBadge status={order.status} />
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 font-bold text-slate-900">Sắp hết hàng</h2>
            {data.lowStock.length === 0 ? (
              <p className="text-sm text-slate-500">Không có sản phẩm nào sắp hết.</p>
            ) : (
              <ul className="space-y-3">
                {data.lowStock.map((item) => (
                  <li key={item.variantId} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{item.productName}</p>
                      <p className="truncate text-xs text-slate-500">{item.variantName} · {item.sku}</p>
                    </div>
                    <span
                      className={
                        item.available <= 0
                          ? "badge bg-rose-50 text-rose-700"
                          : "badge bg-amber-50 text-amber-700"
                      }
                    >
                      {item.available <= 0 ? "Hết" : `Còn ${item.available}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-bold text-slate-900">Đơn theo trạng thái</h2>
            <ul className="space-y-2 text-sm">
              {data.statusCounts.map((entry) => (
                <li key={entry.status} className="flex items-center justify-between">
                  <span className="text-slate-600">{ORDER_STATUS_LABELS[entry.status]}</span>
                  <span className="font-semibold text-slate-900">{entry.count}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
