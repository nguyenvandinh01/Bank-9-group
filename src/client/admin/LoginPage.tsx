import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { Alert } from "../components/ui";

export function AdminLoginPage() {
  const [email, setEmail] = useState("admin@bank9.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => api.post<{ email: string }>("/api/admin/login", { email, password }),
    onSuccess: () => navigate("/admin", { replace: true }),
    onError: (mutationError) => setError(errorMessage(mutationError)),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Vui lòng nhập email và mật khẩu");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-900 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-500 text-xl font-black text-slate-900">
            B9
          </span>
          <h1 className="mt-3 text-2xl font-bold text-white">Bank9 Admin</h1>
          <p className="mt-1 text-sm text-slate-400">Đăng nhập để quản lý cửa hàng</p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6">
          {error ? <Alert>{error}</Alert> : null}
          <div>
            <label htmlFor="email" className="label">Email quản trị</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input"
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="label">Mật khẩu</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input"
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3">
            <Lock className="h-4 w-4" />
            {mutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Demo: <span className="font-mono">admin@bank9.local</span> /{" "}
            <span className="font-mono">Bank9@Demo2026!</span>
          </p>
          <Link to="/" className="block text-center text-sm text-slate-500 hover:text-brand-600">
            ← Về trang cửa hàng
          </Link>
        </form>
      </div>
    </div>
  );
}
