import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Tags,
} from "lucide-react";
import { api } from "../lib/api";
import { PageLoader } from "../components/ui";
import { cn } from "../lib/cn";

const LINKS = [
  { to: "/admin", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/admin/san-pham", label: "Sản phẩm", icon: Package },
  { to: "/admin/don-hang", label: "Đơn hàng", icon: ShoppingBag },
  { to: "/admin/danh-muc", label: "Danh mục & thương hiệu", icon: Tags },
  { to: "/admin/cai-dat", label: "Cài đặt", icon: Settings },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "me"],
    queryFn: () => api.get<{ email: string }>("/api/admin/me"),
    retry: false,
  });

  const logout = useMutation({
    mutationFn: () => api.post("/api/admin/logout"),
    onSettled: () => {
      navigate("/admin/login", { replace: true });
    },
  });

  if (isLoading) return <PageLoader label="Đang kiểm tra phiên đăng nhập..." />;

  if (isError || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div className="card max-w-sm p-6 text-center">
          <p className="font-semibold text-slate-900">Phiên đăng nhập đã hết hạn</p>
          <p className="mt-1 text-sm text-slate-500">Vui lòng đăng nhập lại để tiếp tục.</p>
          <button type="button" className="btn-primary mt-4" onClick={() => navigate("/admin/login")}>
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <aside className="bg-slate-900 text-slate-300 lg:w-64 lg:shrink-0">
        <div className="flex h-16 items-center gap-2 px-5 text-lg font-black text-white">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-slate-900">B9</span>
          Bank9 Admin
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-brand-500/15 text-brand-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )
              }
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-4 lg:block">
          <p className="truncate text-xs text-slate-500">{data.email}</p>
          <div className="mt-3 space-y-1">
            <NavLink to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
              <Store className="h-4 w-4" /> Xem cửa hàng
            </NavLink>
            <button
              type="button"
              onClick={() => logout.mutate()}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Boxes className="h-4 w-4 text-brand-600" /> Quản trị cửa hàng
          </p>
          <button
            type="button"
            onClick={() => logout.mutate()}
            className="btn-ghost px-3 py-2 text-sm lg:hidden"
          >
            <LogOut className="h-4 w-4" /> Đăng xuất
          </button>
        </header>
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
