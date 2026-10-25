import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Alert } from "../components/ui";

export function OrderLookupPage() {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim() || !phone.trim()) {
      setError("Vui lòng nhập mã đơn hàng và số điện thoại");
      return;
    }
    navigate(`/don-hang/${code.trim().toUpperCase()}?phone=${encodeURIComponent(phone.trim())}`);
  };

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-lg">
        <div className="card space-y-5 p-6 sm:p-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tra cứu đơn hàng</h1>
            <p className="mt-1 text-sm text-slate-500">
              Nhập mã đơn hàng và số điện thoại đã dùng khi đặt hàng để xem trạng thái.
            </p>
          </div>

          {error ? <Alert>{error}</Alert> : null}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="code" className="label">Mã đơn hàng</label>
              <input
                id="code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="B9-DEMO-0001"
                className="input font-mono"
              />
            </div>
            <div>
              <label htmlFor="phone" className="label">Số điện thoại</label>
              <input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0901234567"
                inputMode="tel"
                className="input"
              />
            </div>
            <button type="submit" className="btn-primary w-full py-3">
              <Search className="h-4 w-4" /> Tra cứu
            </button>
          </form>

          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Đơn hàng demo có sẵn</p>
            <ul className="mt-2 space-y-1 font-mono text-xs">
              <li>B9-DEMO-0001 · 0901234567 (chờ thanh toán)</li>
              <li>B9-DEMO-0002 · 0912345678 (đã thanh toán)</li>
              <li>B9-DEMO-0003 · 0987654321 (đang giao)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
