import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { Alert, PageLoader } from "../components/ui";

type SettingsForm = Record<
  | "shop_name"
  | "shop_hotline"
  | "shop_email"
  | "shop_address"
  | "bank_name"
  | "bank_bin"
  | "bank_account"
  | "bank_account_name"
  | "shipping_fee"
  | "free_shipping_threshold"
  | "order_hold_minutes",
  string
>;

const FIELDS: { key: keyof SettingsForm; label: string; hint?: string; type?: string }[] = [
  { key: "shop_name", label: "Tên cửa hàng" },
  { key: "shop_hotline", label: "Hotline" },
  { key: "shop_email", label: "Email" },
  { key: "shop_address", label: "Địa chỉ" },
  { key: "bank_name", label: "Ngân hàng", hint: "Ví dụ: Vietcombank" },
  { key: "bank_bin", label: "Mã BIN", hint: "6 chữ số, ví dụ 970436" },
  { key: "bank_account", label: "Số tài khoản" },
  { key: "bank_account_name", label: "Chủ tài khoản", hint: "Viết không dấu" },
  { key: "shipping_fee", label: "Phí vận chuyển (VND)", type: "number" },
  { key: "free_shipping_threshold", label: "Ngưỡng miễn phí ship (VND)", type: "number" },
  { key: "order_hold_minutes", label: "Thời gian giữ hàng (phút)", type: "number" },
];

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<SettingsForm>("/api/admin/settings"),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: (payload: SettingsForm) => api.put("/api/admin/settings", payload),
    onSuccess: () => {
      setError(null);
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["settings", "public"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (mutationError) => setError(errorMessage(mutationError)),
  });

  if (isLoading || !form) return <PageLoader />;

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cài đặt cửa hàng</h1>
        <p className="mt-1 text-sm text-slate-500">
          Thông tin liên hệ và tài khoản nhận chuyển khoản dùng để tạo mã VietQR.
        </p>
      </div>

      {error ? <Alert>{error}</Alert> : null}
      {saved ? <Alert tone="success">Đã lưu cài đặt.</Alert> : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          save.mutate(form);
        }}
        className="card space-y-4 p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key} className={field.key === "shop_address" ? "sm:col-span-2" : undefined}>
              <label htmlFor={field.key} className="label">{field.label}</label>
              <input
                id={field.key}
                type={field.type ?? "text"}
                value={form[field.key]}
                onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                className="input"
                min={field.type === "number" ? 0 : undefined}
              />
              {field.hint ? <p className="mt-1 text-xs text-slate-500">{field.hint}</p> : null}
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Thông tin ngân hàng trong bản demo là giả lập. Không chuyển tiền thật vào tài khoản này.
        </div>

        <button type="submit" disabled={save.isPending} className="btn-primary">
          <Save className="h-4 w-4" />
          {save.isPending ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
      </form>
    </div>
  );
}
