import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Menu, Phone, Search, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { api } from "../lib/api";
import type { PublicSettings } from "../../shared/types";
import { useCart } from "../store/cart";
import { cn } from "../lib/cn";

const NAV_LINKS = [
  { to: "/", label: "Trang chủ" },
  { to: "/san-pham?category=dien-thoai", label: "Điện thoại" },
  { to: "/san-pham?category=laptop", label: "Laptop" },
  { to: "/san-pham?category=may-tinh", label: "Máy tính" },
  { to: "/tra-cuu-don", label: "Tra cứu đơn" },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();
  const itemCount = useCart((state) => state.items.reduce((sum, item) => sum + item.qty, 0));

  const { data: settings } = useQuery({
    queryKey: ["settings", "public"],
    queryFn: () => api.get<PublicSettings>("/api/settings/public"),
    staleTime: 5 * 60 * 1000,
  });

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = keyword.trim();
    navigate(value ? `/san-pham?search=${encodeURIComponent(value)}` : "/san-pham");
    setOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container-page flex h-16 items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-black text-slate-900">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-brand-400">
              B9
            </span>
            <span className="hidden sm:inline">Bank9 Tech</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900",
                    isActive && link.to === "/" && "bg-slate-100 text-slate-900",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="ml-auto hidden max-w-sm flex-1 md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm iPhone, laptop, PC..."
                className="input pl-9"
                aria-label="Tìm kiếm sản phẩm"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <a
              href={`tel:${settings?.shopHotline?.replace(/\s/g, "") ?? ""}`}
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 xl:flex"
            >
              <Phone className="h-4 w-4 text-brand-600" />
              {settings?.shopHotline ?? "1900 0009"}
            </a>
            <Link
              to="/gio-hang"
              className="relative rounded-lg p-2.5 text-slate-700 hover:bg-slate-100"
              aria-label="Giỏ hàng"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
                  {itemCount}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="rounded-lg p-2.5 text-slate-700 hover:bg-slate-100 lg:hidden"
              aria-label="Mở menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open ? (
          <div className="border-t border-slate-200 bg-white lg:hidden">
            <div className="container-page space-y-1 py-3">
              <form onSubmit={submitSearch} className="mb-2 md:hidden">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Tìm sản phẩm..."
                    className="input pl-9"
                  />
                </div>
              </form>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-slate-900 text-slate-300">
        <div className="container-page grid gap-8 py-12 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-lg font-black text-white">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-slate-900">
                B9
              </span>
              {settings?.shopName ?? "Bank9 Tech"}
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Cửa hàng demo điện thoại, laptop và máy tính. Thanh toán QR nội địa, xác nhận thủ công.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">Danh mục</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/san-pham?category=dien-thoai" className="hover:text-brand-400">Điện thoại</Link></li>
              <li><Link to="/san-pham?category=laptop" className="hover:text-brand-400">Laptop</Link></li>
              <li><Link to="/san-pham?category=may-tinh" className="hover:text-brand-400">Máy tính</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/tra-cuu-don" className="hover:text-brand-400">Tra cứu đơn hàng</Link></li>
              <li><Link to="/gio-hang" className="hover:text-brand-400">Giỏ hàng</Link></li>
              <li><Link to="/admin/login" className="hover:text-brand-400">Quản trị</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">Liên hệ</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Hotline: {settings?.shopHotline ?? "1900 0009"}</li>
              <li>Email: {settings?.shopEmail ?? "cskh@bank9.local"}</li>
              <li>{settings?.shopAddress ?? "TP.HCM"}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Bank9 Tech. Dự án demo, không giao dịch thật.
        </div>
      </footer>
    </div>
  );
}
