import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { api, buildQuery } from "../lib/api";
import type { AdminOrderRow } from "../../shared/types";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "../../shared/constants";
import { formatDate, formatVND } from "../lib/format";
import { OrderStatusBadge, PaymentStatusBadge } from "../components/StatusBadge";
import { PageLoader } from "../components/ui";
import { Pagination } from "../components/Pagination";

interface Payload {
  items: AdminOrderRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function AdminOrdersPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const queryString = buildQuery({ status, search, page, pageSize: 20 });
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", queryString],
    queryFn: () => api.get<Payload>(`/api/admin/orders${queryString}`),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Đơn hàng</h1>
        <p className="mt-1 text-sm text-slate-500">{data?.total ?? 0} đơn hàng</p>
      </div>

      <div className="card flex flex-wrap gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Tìm mã đơn, SĐT, tên khách..."
            className="input pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="input w-auto"
        >
          <option value="">Tất cả trạng thái</option>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>{ORDER_STATUS_LABELS[value]}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">SP</th>
                  <th className="px-4 py-3">Tổng tiền</th>
                  <th className="px-4 py-3">Thanh toán</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/admin/don-hang/${order.code}`} className="font-mono font-semibold text-brand-600">
                        {order.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{order.customerName}</p>
                      <p className="text-xs text-slate-500">{order.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{order.itemCount}</td>
                    <td className="px-4 py-3 font-semibold">{formatVND(order.total)}</td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={order.paymentStatus} /></td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && data.items.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">Không có đơn hàng phù hợp.</p>
          ) : null}
        </div>
      )}

      {data ? <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} /> : null}
    </div>
  );
}
