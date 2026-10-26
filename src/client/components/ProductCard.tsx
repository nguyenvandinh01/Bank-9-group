import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import type { ProductCard as ProductCardType } from "../../shared/types";
import { formatVND } from "../lib/format";
import { discountPercent } from "../lib/format";
import { cn } from "../lib/cn";

interface Props {
  product: ProductCardType;
  className?: string;
}

export function ProductCard({ product, className }: Props) {
  const discount = discountPercent(product.minPrice, product.compareAtPrice);
  const soldOut = product.available <= 0;

  return (
    <Link
      to={`/san-pham/${product.slug}`}
      className={cn(
        "group card card-hover flex flex-col overflow-hidden",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Chưa có hình ảnh
          </div>
        )}
        {discount ? (
          <span className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            -{discount}%
          </span>
        ) : null}
        {soldOut ? (
          <span className="absolute inset-x-0 bottom-0 bg-slate-900/80 py-2 text-center text-sm font-semibold text-white backdrop-blur">
            Hết hàng
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
          {product.brandName}
        </p>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-900">
          {product.name}
        </h3>
        <div className="mt-auto space-y-1">
          <p className="text-base font-bold text-rose-600">{formatVND(product.minPrice)}</p>
          {product.compareAtPrice && product.compareAtPrice > product.minPrice ? (
            <p className="text-xs text-slate-400 line-through">
              {formatVND(product.compareAtPrice)}
            </p>
          ) : null}
          <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
            <span>{product.categoryName}</span>
            <span className="inline-flex items-center gap-1 text-brand-600">
              <ShoppingCart className="h-3.5 w-3.5" />
              Xem
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
