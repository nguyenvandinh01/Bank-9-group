import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="container-page py-20 text-center">
      <p className="text-6xl font-black text-brand-500">404</p>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Không tìm thấy trang</h1>
      <p className="mt-2 text-sm text-slate-500">
        Trang bạn truy cập không tồn tại hoặc đã bị di chuyển.
      </p>
      <Link to="/" className="btn-primary mt-6">Về trang chủ</Link>
    </div>
  );
}
