import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import { api, buildQuery } from "../lib/api";
import type { Brand, Category, ProductListPayload } from "../../shared/types";
import { ProductCard } from "../components/ProductCard";
import { Pagination } from "../components/Pagination";
import { EmptyState, SkeletonCard } from "../components/ui";
import { formatVND } from "../lib/format";
import { cn } from "../lib/cn";

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá thấp đến cao" },
  { value: "price_desc", label: "Giá cao đến thấp" },
  { value: "name", label: "Tên A-Z" },
];

const PRICE_RANGES = [
  { label: "Dưới 10 triệu", min: 0, max: 10000000 },
  { label: "10 - 20 triệu", min: 10000000, max: 20000000 },
  { label: "20 - 30 triệu", min: 20000000, max: 30000000 },
  { label: "Trên 30 triệu", min: 30000000, max: 0 },
];

export function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const search = params.get("search") ?? "";
  const category = params.get("category") ?? "";
  const brandParam = params.get("brand") ?? "";
  const sort = params.get("sort") ?? "newest";
  const page = Number(params.get("page") ?? "1");
  const minPrice = Number(params.get("minPrice") ?? "0");
  const maxPrice = Number(params.get("maxPrice") ?? "0");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/api/categories"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: () => api.get<Brand[]>("/api/brands"),
    staleTime: 5 * 60 * 1000,
  });

  const queryString = buildQuery({
    search,
    category,
    brand: brandParam,
    sort,
    page,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["products", queryString],
    queryFn: () => api.get<ProductListPayload>(`/api/products${queryString}`),
  });

  const selectedBrands = useMemo(
    () => new Set(brandParam.split(",").filter(Boolean)),
    [brandParam],
  );

  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    if (!("page" in patch)) next.delete("page");
    setParams(next, { replace: true });
  };

  const toggleBrand = (slug: string) => {
    const next = new Set(selectedBrands);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    update({ brand: [...next].join(",") });
  };

  const activeFilters = [
    category ? { key: "category", label: categories?.find((c) => c.slug === category)?.name ?? category } : null,
    ...selectedBrands.size
      ? [{ key: "brand", label: `${selectedBrands.size} thương hiệu` }]
      : [],
    minPrice || maxPrice
      ? [
          {
            key: "price",
            label: `${minPrice ? formatVND(minPrice) : "0"} - ${maxPrice ? formatVND(maxPrice) : "không giới hạn"}`,
          },
        ]
      : [],
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {search ? `Kết quả cho "${search}"` : "Tất cả sản phẩm"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {data ? `${data.total} sản phẩm` : "Đang tải..."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside
          className={cn(
            "card h-fit space-y-6 p-5",
            filtersOpen ? "block" : "hidden lg:block",
          )}
        >
          <div className="flex items-center justify-between lg:hidden">
            <p className="font-bold text-slate-900">Bộ lọc</p>
            <button type="button" onClick={() => setFiltersOpen(false)} className="btn-ghost p-2">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-slate-900">Danh mục</p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => update({ category: undefined })}
                className={cn(
                  "block w-full rounded-lg px-3 py-2 text-left text-sm",
                  !category ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-600 hover:bg-slate-100",
                )}
              >
                Tất cả
              </button>
              {categories?.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => update({ category: item.slug })}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                    category === item.slug
                      ? "bg-brand-50 font-semibold text-brand-700"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  {item.name}
                  <span className="text-xs text-slate-400">{item.productCount ?? 0}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-slate-900">Khoảng giá</p>
            <div className="space-y-1">
              {PRICE_RANGES.map((range) => {
                const active = minPrice === range.min && maxPrice === range.max;
                return (
                  <button
                    key={range.label}
                    type="button"
                    onClick={() =>
                      update({
                        minPrice: active ? undefined : range.min ? String(range.min) : undefined,
                        maxPrice: active ? undefined : range.max ? String(range.max) : undefined,
                      })
                    }
                    className={cn(
                      "block w-full rounded-lg px-3 py-2 text-left text-sm",
                      active
                        ? "bg-brand-50 font-semibold text-brand-700"
                        : "text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-slate-900">Thương hiệu</p>
            <div className="max-h-64 space-y-1 overflow-auto pr-1">
              {brands?.map((brand) => (
                <label
                  key={brand.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.has(brand.slug)}
                    onChange={() => toggleBrand(brand.slug)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  />
                  <span className="flex-1">{brand.name}</span>
                  <span className="text-xs text-slate-400">{brand.productCount ?? 0}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="btn-outline lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
            </button>

            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span
                  key={filter.key}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
                >
                  {filter.label}
                  <button
                    type="button"
                    onClick={() =>
                      filter.key === "price"
                        ? update({ minPrice: undefined, maxPrice: undefined })
                        : update({ [filter.key]: undefined })
                    }
                    aria-label={`Bỏ lọc ${filter.label}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-slate-500">Sắp xếp</label>
              <select
                id="sort"
                value={sort}
                onChange={(event) => update({ sort: event.target.value })}
                className="input w-auto py-2"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              title="Không tìm thấy sản phẩm"
              description="Thử từ khóa khác hoặc bỏ bớt bộ lọc để xem thêm sản phẩm."
              action={
                <button type="button" className="btn-primary" onClick={() => setParams({})}>
                  Xóa bộ lọc
                </button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {data.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                onChange={(nextPage) => update({ page: String(nextPage) })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
