import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Headphones, ShieldCheck, Truck } from "lucide-react";
import { api } from "../lib/api";
import type { HomePayload } from "../../shared/types";
import { ProductCard } from "../components/ProductCard";
import { PageLoader, SectionTitle } from "../components/ui";

const CATEGORY_ICONS: Record<string, string> = {
  "dien-thoai": "📱",
  laptop: "💻",
  "may-tinh": "🖥️",
};

const BENEFITS = [
  { icon: BadgeCheck, title: "Chính hãng 100%", text: "Bảo hành theo tiêu chuẩn nhà sản xuất" },
  { icon: Truck, title: "Giao hàng toàn quốc", text: "Miễn phí vận chuyển đơn từ 5 triệu" },
  { icon: ShieldCheck, title: "Thanh toán an toàn", text: "QR nội địa, xác nhận bởi cửa hàng" },
  { icon: Headphones, title: "Hỗ trợ tận tâm", text: "Tư vấn cấu hình phù hợp nhu cầu" },
];

export function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["home"],
    queryFn: () => api.get<HomePayload>("/api/home"),
  });

  if (isLoading || !data) return <PageLoader />;

  return (
    <div className="space-y-14 pb-4">
      <section className="bg-slate-900 text-white">
        <div className="container-page grid gap-10 py-14 lg:grid-cols-2 lg:items-center lg:py-20">
          <div className="space-y-6">
            <span className="badge bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30">
              Công nghệ chính hãng · Demo TMĐT
            </span>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              Điện thoại, laptop và PC
              <span className="block text-brand-400">cho mọi nhu cầu.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-slate-300">
              Hơn 24 sản phẩm từ Apple, Samsung, Xiaomi, ASUS, Dell... Giá minh bạch, thanh toán QR
              nội địa, hỗ trợ trả góp 0% (demo).
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/san-pham" className="btn-primary px-6 py-3">
                Mua ngay <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/tra-cuu-don"
                className="btn border border-white/20 px-6 py-3 text-white hover:bg-white/10"
              >
                Tra cứu đơn hàng
              </Link>
            </div>
            <dl className="grid max-w-lg grid-cols-3 gap-4 pt-2 text-sm">
              <div>
                <dt className="text-slate-400">Sản phẩm</dt>
                <dd className="text-xl font-bold text-white">24+</dd>
              </div>
              <div>
                <dt className="text-slate-400">Thương hiệu</dt>
                <dd className="text-xl font-bold text-white">{data.brands.length}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Hỗ trợ</dt>
                <dd className="text-xl font-bold text-white">24/7</dd>
              </div>
            </dl>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {data.featured.slice(0, 3).map((product) => (
              <Link
                key={product.id}
                to={`/san-pham/${product.slug}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 transition hover:bg-white/10"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="aspect-square w-full rounded-xl object-cover transition group-hover:scale-105"
                  />
                ) : null}
                <p className="mt-2 line-clamp-2 px-1 pb-1 text-xs font-medium text-slate-200">
                  {product.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {data.categories.map((category) => (
            <Link
              key={category.id}
              to={`/san-pham?category=${category.slug}`}
              className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-2xl">
                {CATEGORY_ICONS[category.slug] ?? "🛒"}
              </span>
              <div>
                <p className="font-bold text-slate-900">{category.name}</p>
                <p className="text-sm text-slate-500">{category.productCount ?? 0} sản phẩm</p>
              </div>
              <ArrowRight className="ml-auto h-5 w-5 text-slate-400" />
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page">
        <SectionTitle
          title="Sản phẩm nổi bật"
          subtitle="Được khách hàng lựa chọn nhiều nhất tại Bank9 Tech"
          action={
            <Link to="/san-pham" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              Xem tất cả →
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {data.featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="flex gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <benefit.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">{benefit.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{benefit.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page">
        <SectionTitle
          title="Hàng mới về"
          subtitle="Cập nhật liên tục các mẫu mới nhất"
          action={
            <Link to="/san-pham?sort=newest" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              Xem tất cả →
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {data.newest.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
