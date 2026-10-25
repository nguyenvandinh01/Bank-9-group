import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronRight, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { api } from "../lib/api";
import type { ProductDetail, PublicSettings } from "../../shared/types";
import { formatVND, discountPercent } from "../lib/format";
import { SPEC_LABELS } from "../../shared/constants";
import { useCart } from "../store/cart";
import { Alert, PageLoader } from "../components/ui";
import { cn } from "../lib/cn";

export function ProductDetailPage() {
  const { slug = "" } = useParams();
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCart((state) => state.addItem);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.get<ProductDetail>(`/api/products/${slug}`),
  });

  const { data: settings } = useQuery({
    queryKey: ["settings", "public"],
    queryFn: () => api.get<PublicSettings>("/api/settings/public"),
    staleTime: 5 * 60 * 1000,
  });

  const activeVariants = useMemo(
    () => product?.variants.filter((variant) => variant.isActive) ?? [],
    [product],
  );

  useEffect(() => {
    if (activeVariants.length > 0) {
      const firstAvailable = activeVariants.find((variant) => variant.available > 0);
      setSelectedVariantId((firstAvailable ?? activeVariants[0]).id);
    }
  }, [activeVariants]);

  useEffect(() => {
    setAdded(false);
    setQty(1);
  }, [selectedVariantId]);

  const selected = activeVariants.find((variant) => variant.id === selectedVariantId) ?? null;
  const discount = selected ? discountPercent(selected.price, selected.compareAtPrice) : null;
  const images = product?.images.length ? product.images : product?.imageUrl ? [{ url: product.imageUrl, alt: product.name }] : [];
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) return <PageLoader />;
  if (error || !product) {
    return (
      <div className="container-page py-16">
        <Alert>Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng kinh doanh.</Alert>
        <Link to="/san-pham" className="btn-primary mt-4">Quay lại danh sách</Link>
      </div>
    );
  }

  const handleAdd = () => {
    if (!selected || selected.available <= 0) return;
    addItem(
      {
        variantId: selected.id,
        productSlug: product.slug,
        productName: product.name,
        variantName: selected.name,
        sku: selected.sku,
        price: selected.price,
        imageUrl: selected.imageUrl ?? product.imageUrl,
        available: selected.available,
      },
      qty,
    );
    setAdded(true);
  };

  return (
    <div className="container-page py-8">
      <nav className="mb-5 flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <Link to="/" className="hover:text-brand-600">Trang chủ</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/san-pham?category=${product.categorySlug}`} className="hover:text-brand-600">
          {product.categoryName}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-800">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="card aspect-square overflow-hidden">
            {images[activeImage] ? (
              <img
                src={images[activeImage].url}
                alt={images[activeImage].alt || product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-slate-400">Chưa có hình ảnh</div>
            )}
          </div>
          {images.length > 1 ? (
            <div className="flex gap-2 overflow-auto pb-1">
              {images.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={cn(
                    "h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2",
                    activeImage === index ? "border-brand-500" : "border-transparent",
                  )}
                >
                  <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              {product.brandName}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{product.name}</h1>
            <p className="mt-2 text-sm text-slate-500">{product.description}</p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <p className="text-3xl font-black text-rose-600">
              {formatVND(selected?.price ?? product.minPrice)}
            </p>
            {selected?.compareAtPrice && selected.compareAtPrice > selected.price ? (
              <>
                <p className="text-base text-slate-400 line-through">{formatVND(selected.compareAtPrice)}</p>
                {discount ? (
                  <span className="badge bg-rose-100 text-rose-700">-{discount}%</span>
                ) : null}
              </>
            ) : null}
          </div>

          <div>
            <p className="label">Chọn phiên bản</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {activeVariants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  disabled={variant.available <= 0}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={cn(
                    "rounded-xl border px-3.5 py-3 text-left text-sm transition",
                    variant.id === selectedVariantId
                      ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                      : "border-slate-200 hover:border-brand-300",
                    variant.available <= 0 && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span className="block font-semibold text-slate-800">{variant.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {formatVND(variant.price)} · {variant.available > 0 ? `Còn ${variant.available}` : "Hết hàng"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center rounded-xl border border-slate-300">
              <button
                type="button"
                className="px-3 py-2.5 text-slate-500 hover:text-slate-900"
                onClick={() => setQty((value) => Math.max(1, value - 1))}
                aria-label="Giảm số lượng"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-sm font-semibold">{qty}</span>
              <button
                type="button"
                className="px-3 py-2.5 text-slate-500 hover:text-slate-900"
                onClick={() =>
                  setQty((value) => Math.min(10, value + 1, selected?.available ?? 10))
                }
                aria-label="Tăng số lượng"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!selected || selected.available <= 0}
              className="btn-primary flex-1 px-6 py-3"
            >
              <ShoppingCart className="h-4 w-4" />
              {selected?.available ? "Thêm vào giỏ hàng" : "Tạm hết hàng"}
            </button>
          </div>

          {added ? (
            <Alert tone="success">
              <span className="flex flex-wrap items-center gap-2">
                <Check className="h-4 w-4" /> Đã thêm vào giỏ hàng.
                <Link to="/gio-hang" className="font-semibold underline">Xem giỏ hàng</Link>
              </span>
            </Alert>
          ) : null}

          <div className="grid gap-3 rounded-2xl bg-slate-100 p-4 text-sm sm:grid-cols-2">
            <p className="flex items-center gap-2 text-slate-600">
              <Truck className="h-4 w-4 text-brand-600" />
              Miễn phí ship đơn từ {formatVND(settings?.freeShippingThreshold ?? 5000000)}
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              Bảo hành chính hãng
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Thông số kỹ thuật</h2>
          <dl className="divide-y divide-slate-100">
            {Object.entries(product.specs).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 py-2.5 text-sm">
                <dt className="text-slate-500">{SPEC_LABELS[key] ?? key}</dt>
                <dd className="text-right font-medium text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="card p-6">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Mô tả sản phẩm</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {product.description}
          </p>
        </section>
      </div>
    </div>
  );
}
