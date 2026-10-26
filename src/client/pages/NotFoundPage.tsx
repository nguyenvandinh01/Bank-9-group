import { Home, SearchX } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="container-page py-20">
      <div className="card mx-auto max-w-xl px-8 py-16 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-brand-50 text-brand-600">
          <SearchX className="h-10 w-10" />
        </div>
        <p className="mt-6 text-6xl font-black text-brand-500">404</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-slate-500">
          Trang bạn truy cập không tồn tại hoặc đã bị di chuyển. Hãy quay lại trang chủ để tiếp tục mua sắm.
        </p>
        <Link to="/" className="btn-primary mt-6 px-6">
          <Home className="h-4 w-4" /> Về trang chủ
        </Link>
      </div>
    </div>
  );
}
