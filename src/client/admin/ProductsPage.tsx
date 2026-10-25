import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api, buildQuery, errorMessage } from "../lib/api";
import type { AdminProductSummary } from "../../shared/types";
import { formatVND } from "../lib/format";
import { Alert, PageLoader } from "../components/ui";
import { Pagination } from "../components/Pagination";
import { cn } from "../lib/cn";

interface Payload {
  items: AdminProductSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const queryString = buildQuery({ search, page, pageSize: 20 });
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", queryString],
    queryFn: () => api.get<Payload>(`/api/admin/products${queryString}`),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/products/${id}`),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (mutationError) => setError(errorMessage(mutationError)),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sản phẩm</h1>
          <p className="mt-1 text-sm text-slate-500">{data?.total ?? 0} sản phẩm trong cửa hàng</p>
        </div>
        <Link to="/admin/san-pham/moi" className="btn-primary">
          <Plus className="h-4 w-4" /> Thêm sản phẩm
        </Link>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <div className="card p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tên hoặc slug..."
            className="input pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">Danh mục</th>
                  <th className="px-4 py-3">Giá từ</th>
                  <th className="px-4 py-3">Tồn kho</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">{product.name}</p>
                          <p className="truncate text-xs text-slate-500">{product.brandName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{product.categoryName}</td>
                    <td className="px-4 py-3 font-medium">{formatVND(product.minPrice)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "badge",
                          product.available <= 0
                            ? "bg-rose-50 text-rose-700"
                            : product.available <= 5
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700",
                        )}
                      >
                        {product.available}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{product.skuCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={cn(
                            "badge",
                            product.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {product.isActive ? "Đang bán" : "Đã ẩn"}
                        </span>
                        {product.isFeatured ? (
                          <span className="badge bg-brand-50 text-brand-700">Nổi bật</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/admin/san-pham/${product.id}`}
                          className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-600"
                          aria-label="Sửa"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Ẩn sản phẩm "${product.name}"?`)) remove.mutate(product.id);
                          }}
                          className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Ẩn sản phẩm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && data.items.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">Không có sản phẩm phù hợp.</p>
          ) : null}
        </div>
      )}

      {data ? <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} /> : null}
    </div>
  );
}
