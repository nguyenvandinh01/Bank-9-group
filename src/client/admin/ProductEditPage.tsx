import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Plus, Trash2, Upload } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { AdminProductDetail, Brand, Category } from "../../shared/types";
import { Alert, PageLoader } from "../components/ui";

interface VariantForm {
  id?: number;
  sku: string;
  name: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  attributes: string;
  isActive: boolean;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  brandId: string;
  specs: string;
  isFeatured: boolean;
  isActive: boolean;
  images: string[];
  variants: VariantForm[];
}

const EMPTY_VARIANT: VariantForm = {
  sku: "",
  name: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
  attributes: "",
  isActive: true,
};

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  description: "",
  categoryId: "",
  brandId: "",
  specs: "",
  isFeatured: false,
  isActive: true,
  images: [],
  variants: [{ ...EMPTY_VARIANT }],
};

function parseAttributes(value: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of value.split("\n")) {
    const [key, ...rest] = line.split(":");
    if (!key?.trim() || rest.length === 0) continue;
    result[key.trim()] = rest.join(":").trim();
  }
  return result;
}

function stringifyAttributes(value: Record<string, string>): string {
  return Object.entries(value)
    .map(([key, entry]) => `${key}: ${entry}`)
    .join("\n");
}

function parseSpecs(value: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of value.split("\n")) {
    const [key, ...rest] = line.split(":");
    if (!key?.trim() || rest.length === 0) continue;
    result[key.trim()] = rest.join(":").trim();
  }
  return result;
}

function stringifySpecs(value: Record<string, string>): string {
  return Object.entries(value)
    .map(([key, entry]) => `${key}: ${entry}`)
    .join("\n");
}

export function AdminProductEditPage() {
  const { id } = useParams();
  const isNew = !id || id === "moi";
  const productId = isNew ? 0 : Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => api.get<Category[]>("/api/admin/categories"),
  });
  const { data: brands } = useQuery({
    queryKey: ["admin", "brands"],
    queryFn: () => api.get<Brand[]>("/api/admin/brands"),
  });
  const { data: product, isLoading } = useQuery({
    queryKey: ["admin", "product", productId],
    queryFn: () => api.get<AdminProductDetail>(`/api/admin/products/${productId}`),
    enabled: !isNew,
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId: String(product.categoryId),
        brandId: String(product.brandId),
        specs: stringifySpecs(product.specs),
        isFeatured: product.isFeatured,
        isActive: product.isActive,
        images: product.images.map((image) => image.url),
        variants: product.variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          name: variant.name,
          price: String(variant.price),
          compareAtPrice: variant.compareAtPrice ? String(variant.compareAtPrice) : "",
          stock: String(variant.stock),
          attributes: stringifyAttributes(variant.attributes),
          isActive: variant.isActive,
        })),
      });
    }
  }, [product]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Vui lòng nhập tên sản phẩm");
      if (!form.categoryId) throw new Error("Vui lòng chọn danh mục");
      if (!form.brandId) throw new Error("Vui lòng chọn thương hiệu");
      if (form.variants.length === 0) throw new Error("Cần ít nhất một phiên bản");

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim(),
        categoryId: Number(form.categoryId),
        brandId: Number(form.brandId),
        specs: parseSpecs(form.specs),
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        images: form.images,
        variants: form.variants.map((variant) => {
          const price = Number(variant.price);
          const stock = Number(variant.stock);
          if (!variant.sku.trim()) throw new Error("SKU không được để trống");
          if (!variant.name.trim()) throw new Error("Tên phiên bản không được để trống");
          if (!Number.isFinite(price) || price < 0) throw new Error(`Giá của ${variant.sku} không hợp lệ`);
          if (!Number.isFinite(stock) || stock < 0) throw new Error(`Tồn kho của ${variant.sku} không hợp lệ`);
          return {
            id: variant.id,
            sku: variant.sku.trim(),
            name: variant.name.trim(),
            price,
            compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
            stock,
            attributes: parseAttributes(variant.attributes),
          };
        }),
      };

      if (isNew) {
        return api.post<{ id: number }>("/api/admin/products", payload);
      }
      return api.put<{ id: number }>(`/api/admin/products/${productId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "product", productId] });
      navigate("/admin/san-pham");
    },
    onError: (mutationError) => setError(errorMessage(mutationError)),
  });

  const uploadImage = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const result = await api.upload<{ url: string }>("/api/admin/uploads", file);
      setForm((value) => ({ ...value, images: [...value.images, result.url] }));
    } catch (uploadError) {
      setError(errorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  };

  const updateVariant = (index: number, patch: Partial<VariantForm>) => {
    setForm((value) => ({
      ...value,
      variants: value.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      ),
    }));
  };

  if (!isNew && isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isNew ? "Thêm sản phẩm" : "Sửa sản phẩm"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isNew ? "Tạo sản phẩm mới với ít nhất một phiên bản." : `ID #${productId}`}
          </p>
        </div>
        <Link to="/admin/san-pham" className="btn-outline">Quay lại</Link>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          save.mutate();
        }}
        className="space-y-5"
      >
        <section className="card space-y-4 p-5">
          <h2 className="font-bold text-slate-900">Thông tin chung</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Tên sản phẩm *</label>
              <input
                value={form.name}
                onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
                className="input"
                placeholder="iPhone 15 Pro Max 256GB"
              />
            </div>
            <div>
              <label className="label">Slug (tùy chọn)</label>
              <input
                value={form.slug}
                onChange={(event) => setForm((value) => ({ ...value, slug: event.target.value }))}
                className="input font-mono"
                placeholder="iphone-15-pro-max-256gb"
              />
            </div>
            <div>
              <label className="label">Danh mục *</label>
              <select
                value={form.categoryId}
                onChange={(event) => setForm((value) => ({ ...value, categoryId: event.target.value }))}
                className="input"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Thương hiệu *</label>
              <select
                value={form.brandId}
                onChange={(event) => setForm((value) => ({ ...value, brandId: event.target.value }))}
                className="input"
              >
                <option value="">-- Chọn thương hiệu --</option>
                {brands?.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Mô tả</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))}
              className="input resize-y"
            />
          </div>
          <div>
            <label className="label">Thông số (mỗi dòng dạng key: value)</label>
            <textarea
              rows={4}
              value={form.specs}
              onChange={(event) => setForm((value) => ({ ...value, specs: event.target.value }))}
              className="input resize-y font-mono text-xs"
              placeholder={"cpu: Apple A17 Pro\nram: 8GB"}
            />
          </div>
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => setForm((value) => ({ ...value, isFeatured: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              Sản phẩm nổi bật
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              Đang kinh doanh
            </label>
          </div>
        </section>

        <section className="card space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-slate-900">Hình ảnh</h2>
            <label className="btn-outline cursor-pointer">
              <Upload className="h-4 w-4" />
              {uploading ? "Đang tải..." : "Tải ảnh lên"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadImage(file);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            {form.images.map((url) => (
              <div key={url} className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() =>
                    setForm((value) => ({ ...value, images: value.images.filter((image) => image !== url) }))
                  }
                  className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-rose-600 shadow"
                  aria-label="Xóa ảnh"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="grid h-24 w-24 place-items-center rounded-xl border border-dashed border-slate-300 text-slate-400">
              <ImagePlus className="h-6 w-6" />
            </div>
          </div>
          <div>
            <label className="label">Hoặc nhập URL ảnh</label>
            <div className="flex gap-2">
              <input
                id="image-url"
                className="input"
                placeholder="/seed/iphone-15.svg"
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  const value = (event.target as HTMLInputElement).value.trim();
                  if (!value) return;
                  setForm((state) => ({ ...state, images: [...state.images, value] }));
                  (event.target as HTMLInputElement).value = "";
                }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Nhấn Enter để thêm URL vào danh sách.</p>
          </div>
        </section>

        <section className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Phiên bản & tồn kho</h2>
            <button
              type="button"
              onClick={() =>
                setForm((value) => ({ ...value, variants: [...value.variants, { ...EMPTY_VARIANT }] }))
              }
              className="btn-outline"
            >
              <Plus className="h-4 w-4" /> Thêm phiên bản
            </button>
          </div>

          <div className="space-y-4">
            {form.variants.map((variant, index) => (
              <div key={variant.id ?? index} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Phiên bản #{index + 1}</p>
                  {form.variants.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((value) => ({
                          ...value,
                          variants: value.variants.filter((_, variantIndex) => variantIndex !== index),
                        }))
                      }
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Xóa phiên bản"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="label">SKU *</label>
                    <input
                      value={variant.sku}
                      onChange={(event) => updateVariant(index, { sku: event.target.value })}
                      className="input font-mono"
                      placeholder="IP15PM-256-TITAN"
                    />
                  </div>
                  <div>
                    <label className="label">Tên phiên bản *</label>
                    <input
                      value={variant.name}
                      onChange={(event) => updateVariant(index, { name: event.target.value })}
                      className="input"
                      placeholder="256GB - Titan tự nhiên"
                    />
                  </div>
                  <div>
                    <label className="label">Tồn kho *</label>
                    <input
                      type="number"
                      min={0}
                      value={variant.stock}
                      onChange={(event) => updateVariant(index, { stock: event.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Giá bán (VND) *</label>
                    <input
                      type="number"
                      min={0}
                      value={variant.price}
                      onChange={(event) => updateVariant(index, { price: event.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Giá gốc (VND)</label>
                    <input
                      type="number"
                      min={0}
                      value={variant.compareAtPrice}
                      onChange={(event) => updateVariant(index, { compareAtPrice: event.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Thuộc tính (mỗi dòng key: value)</label>
                    <textarea
                      rows={2}
                      value={variant.attributes}
                      onChange={(event) => updateVariant(index, { attributes: event.target.value })}
                      className="input resize-none font-mono text-xs"
                      placeholder={"storage: 256GB\ncolor: Titan"}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={save.isPending} className="btn-primary px-6">
            {save.isPending ? "Đang lưu..." : isNew ? "Tạo sản phẩm" : "Lưu thay đổi"}
          </button>
          <Link to="/admin/san-pham" className="btn-outline">Hủy</Link>
        </div>
      </form>
    </div>
  );
}
