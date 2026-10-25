import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { Brand, Category } from "../../shared/types";
import { Alert, PageLoader } from "../components/ui";

interface EditState {
  kind: "category" | "brand";
  id?: number;
  name: string;
  slug: string;
  description: string;
}

export function AdminTaxonomyPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditState | null>(null);

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => api.get<Category[]>("/api/admin/categories"),
  });
  const { data: brands, isLoading: loadingBrands } = useQuery({
    queryKey: ["admin", "brands"],
    queryFn: () => api.get<Brand[]>("/api/admin/brands"),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "brands"] });
  };

  const save = useMutation({
    mutationFn: (state: EditState) => {
      const payload =
        state.kind === "category"
          ? { name: state.name, slug: state.slug || undefined, description: state.description || undefined }
          : { name: state.name, slug: state.slug || undefined };
      const path = state.kind === "category" ? "categories" : "brands";
      return state.id
        ? api.put(`/api/admin/${path}/${state.id}`, payload)
        : api.post(`/api/admin/${path}`, payload);
    },
    onSuccess: () => {
      setEditing(null);
      setError(null);
      invalidate();
    },
    onError: (mutationError) => setError(errorMessage(mutationError)),
  });

  const remove = useMutation({
    mutationFn: (state: { kind: "category" | "brand"; id: number }) =>
      api.delete(`/api/admin/${state.kind === "category" ? "categories" : "brands"}/${state.id}`),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (mutationError) => setError(errorMessage(mutationError)),
  });

  if (loadingCategories || loadingBrands) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Danh mục & thương hiệu</h1>
        <p className="mt-1 text-sm text-slate-500">Quản lý danh mục và thương hiệu sản phẩm.</p>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-900">Danh mục</h2>
            <button
              type="button"
              onClick={() => setEditing({ kind: "category", name: "", slug: "", description: "" })}
              className="btn-outline px-3 py-2"
            >
              <Plus className="h-4 w-4" /> Thêm
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {categories?.map((category) => (
              <li key={category.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800">{category.name}</p>
                  <p className="text-xs text-slate-500">{category.slug} · {category.productCount ?? 0} sản phẩm</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      kind: "category",
                      id: category.id,
                      name: category.name,
                      slug: category.slug,
                      description: category.description ?? "",
                    })
                  }
                  className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-600"
                  aria-label="Sửa danh mục"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Xóa danh mục "${category.name}"?`)) {
                      remove.mutate({ kind: "category", id: category.id });
                    }
                  }}
                  className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Xóa danh mục"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-900">Thương hiệu</h2>
            <button
              type="button"
              onClick={() => setEditing({ kind: "brand", name: "", slug: "", description: "" })}
              className="btn-outline px-3 py-2"
            >
              <Plus className="h-4 w-4" /> Thêm
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {brands?.map((brand) => (
              <li key={brand.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800">{brand.name}</p>
                  <p className="text-xs text-slate-500">{brand.slug} · {brand.productCount ?? 0} sản phẩm</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      kind: "brand",
                      id: brand.id,
                      name: brand.name,
                      slug: brand.slug,
                      description: "",
                    })
                  }
                  className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-600"
                  aria-label="Sửa thương hiệu"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Xóa thương hiệu "${brand.name}"?`)) {
                      remove.mutate({ kind: "brand", id: brand.id });
                    }
                  }}
                  className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Xóa thương hiệu"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!editing.name.trim()) {
                setError("Vui lòng nhập tên");
                return;
              }
              save.mutate(editing);
            }}
            className="card w-full max-w-md space-y-4 p-5"
          >
            <h2 className="font-bold text-slate-900">
              {editing.id ? "Sửa" : "Thêm"} {editing.kind === "category" ? "danh mục" : "thương hiệu"}
            </h2>
            <div>
              <label className="label">Tên *</label>
              <input
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                className="input"
                autoFocus
              />
            </div>
            <div>
              <label className="label">Slug (tùy chọn)</label>
              <input
                value={editing.slug}
                onChange={(event) => setEditing({ ...editing, slug: event.target.value })}
                className="input font-mono"
              />
            </div>
            {editing.kind === "category" ? (
              <div>
                <label className="label">Mô tả</label>
                <textarea
                  rows={2}
                  value={editing.description}
                  onChange={(event) => setEditing({ ...editing, description: event.target.value })}
                  className="input resize-none"
                />
              </div>
            ) : null}
            <div className="flex gap-2">
              <button type="submit" disabled={save.isPending} className="btn-primary flex-1">
                {save.isPending ? "Đang lưu..." : "Lưu"}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn-outline">
                Hủy
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
