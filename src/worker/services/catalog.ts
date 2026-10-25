import { notFound } from "../lib/errors";
import { normalizeSearch } from "../../shared/constants";
import type {
  Brand,
  Category,
  ProductCard,
  ProductDetail,
  ProductListPayload,
} from "../../shared/types";

interface ProductRow {
  id: number;
  name: string;
  slug: string;
  is_featured: number;
  brand_name: string;
  brand_slug: string;
  category_name: string;
  category_slug: string;
  image_url: string | null;
  min_price: number;
  compare_at_price: number | null;
  available: number;
}

function mapCard(row: ProductRow): ProductCard {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    imageUrl: row.image_url,
    brandName: row.brand_name,
    brandSlug: row.brand_slug,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    minPrice: row.min_price,
    compareAtPrice: row.compare_at_price,
    available: row.available,
    isFeatured: row.is_featured === 1,
  };
}

const CARD_COLUMNS = `
  SELECT p.id, p.name, p.slug, p.is_featured,
    b.name AS brand_name, b.slug AS brand_slug,
    c.name AS category_name, c.slug AS category_slug,
    (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_url,
    COALESCE((SELECT MIN(v.price) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1), 0) AS min_price,
    (SELECT v.compare_at_price FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1 ORDER BY v.price LIMIT 1) AS compare_at_price,
    COALESCE((
      SELECT SUM(i.on_hand - i.reserved)
      FROM product_variants v JOIN inventory i ON i.variant_id = v.id
      WHERE v.product_id = p.id AND v.is_active = 1
    ), 0) AS available
`;

const CARD_FROM = `
  FROM products p
  JOIN brands b ON b.id = p.brand_id
  JOIN categories c ON c.id = p.category_id
`;

export interface ProductQuery {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "name";
  page?: number;
  pageSize?: number;
  featured?: boolean;
}

export async function listProducts(
  db: D1Database,
  query: ProductQuery,
): Promise<ProductListPayload> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, query.pageSize ?? 12));
  const where: string[] = ["p.is_active = 1"];
  const params: unknown[] = [];

  if (query.featured) where.push("p.is_featured = 1");

  if (query.category) {
    where.push("c.slug = ?");
    params.push(query.category);
  }

  if (query.brand) {
    const brands = query.brand
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (brands.length > 0) {
      where.push(`b.slug IN (${brands.map(() => "?").join(",")})`);
      params.push(...brands);
    }
  }

  const searchTokens = normalizeSearch(query.search ?? "")
    .split(" ")
    .filter((token) => token.length >= 1)
    .slice(0, 6);

  let from = CARD_FROM;
  if (searchTokens.length > 0) {
    from += " JOIN products_fts ON products_fts.rowid = p.id";
    where.push("products_fts MATCH ?");
    params.push(searchTokens.map((token) => `${token}*`).join(" "));
  }

  if (typeof query.minPrice === "number" && query.minPrice > 0) {
    where.push(
      "COALESCE((SELECT MIN(v.price) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1), 0) >= ?",
    );
    params.push(query.minPrice);
  }
  if (typeof query.maxPrice === "number" && query.maxPrice > 0) {
    where.push(
      "COALESCE((SELECT MIN(v.price) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1), 0) <= ?",
    );
    params.push(query.maxPrice);
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;
  const orderBy =
    query.sort === "price_asc"
      ? "ORDER BY min_price ASC, p.id ASC"
      : query.sort === "price_desc"
        ? "ORDER BY min_price DESC, p.id DESC"
        : query.sort === "name"
          ? "ORDER BY p.name COLLATE NOCASE ASC"
          : "ORDER BY p.created_at DESC, p.id DESC";

  const countStatement = db
    .prepare(`SELECT COUNT(*) AS total ${from} ${whereSql}`)
    .bind(...params);
  const itemsStatement = db
    .prepare(`${CARD_COLUMNS} ${from} ${whereSql} ${orderBy} LIMIT ? OFFSET ?`)
    .bind(...params, pageSize, (page - 1) * pageSize);

  const [countResult, itemsResult] = await db.batch([countStatement, itemsStatement]);
  const total = Number(
    (countResult.results?.[0] as { total?: number } | undefined)?.total ?? 0,
  );
  const items = ((itemsResult.results ?? []) as unknown as ProductRow[]).map(mapCard);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getFeatured(db: D1Database, limit = 8): Promise<ProductCard[]> {
  const result = await db
    .prepare(`${CARD_COLUMNS} ${CARD_FROM} WHERE p.is_active = 1 AND p.is_featured = 1 ORDER BY p.id LIMIT ?`)
    .bind(limit)
    .all<ProductRow>();
  return (result.results ?? []).map(mapCard);
}

export async function getNewest(db: D1Database, limit = 8): Promise<ProductCard[]> {
  const result = await db
    .prepare(`${CARD_COLUMNS} ${CARD_FROM} WHERE p.is_active = 1 ORDER BY p.created_at DESC, p.id DESC LIMIT ?`)
    .bind(limit)
    .all<ProductRow>();
  return (result.results ?? []).map(mapCard);
}

export async function getProductBySlug(
  db: D1Database,
  slug: string,
): Promise<ProductDetail> {
  const row = await db
    .prepare(
      `SELECT p.id, p.name, p.slug, p.description, p.specs_json, p.is_featured,
        b.name AS brand_name, b.slug AS brand_slug,
        c.name AS category_name, c.slug AS category_slug,
        (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_url,
        COALESCE((SELECT MIN(v.price) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1), 0) AS min_price,
        (SELECT v.compare_at_price FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1 ORDER BY v.price LIMIT 1) AS compare_at_price,
        COALESCE((
          SELECT SUM(i.on_hand - i.reserved)
          FROM product_variants v JOIN inventory i ON i.variant_id = v.id
          WHERE v.product_id = p.id AND v.is_active = 1
        ), 0) AS available
       FROM products p
       JOIN brands b ON b.id = p.brand_id
       JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.is_active = 1`,
    )
    .bind(slug)
    .first<
      ProductRow & {
        description: string;
        specs_json: string;
      }
    >();

  if (!row) throw notFound("Không tìm thấy sản phẩm");

  const [images, variants] = await db.batch([
    db
      .prepare("SELECT url, alt FROM product_images WHERE product_id = ? ORDER BY sort_order, id")
      .bind(row.id),
    db
      .prepare(
        `SELECT v.id, v.sku, v.name, v.price, v.compare_at_price, v.attributes_json,
           v.image_url, v.is_active, COALESCE(i.on_hand - i.reserved, 0) AS available
         FROM product_variants v LEFT JOIN inventory i ON i.variant_id = v.id
         WHERE v.product_id = ? AND v.is_active = 1
         ORDER BY v.sort_order, v.id`,
      )
      .bind(row.id),
  ]);

  const card = mapCard(row);
  return {
    ...card,
    description: row.description,
    specs: safeJson<Record<string, string>>(row.specs_json, {}),
    images: (images.results ?? []) as { url: string; alt: string }[],
    variants: (
      (variants.results ?? []) as {
        id: number;
        sku: string;
        name: string;
        price: number;
        compare_at_price: number | null;
        attributes_json: string;
        image_url: string | null;
        is_active: number;
        available: number;
      }[]
    ).map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      price: variant.price,
      compareAtPrice: variant.compare_at_price,
      attributes: safeJson<Record<string, string>>(variant.attributes_json, {}),
      imageUrl: variant.image_url,
      available: Number(variant.available ?? 0),
      isActive: variant.is_active === 1,
    })),
  };
}

export async function listCategories(db: D1Database): Promise<Category[]> {
  const result = await db
    .prepare(
      `SELECT c.id, c.name, c.slug, c.description, c.image_url, c.sort_order,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS product_count
       FROM categories c ORDER BY c.sort_order, c.id`,
    )
    .all<{
      id: number;
      name: string;
      slug: string;
      description: string | null;
      image_url: string | null;
      sort_order: number;
      product_count: number;
    }>();
  return (result.results ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    productCount: row.product_count,
  }));
}

export async function listBrands(db: D1Database): Promise<Brand[]> {
  const result = await db
    .prepare(
      `SELECT b.id, b.name, b.slug, b.logo_url,
        (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.is_active = 1) AS product_count
       FROM brands b ORDER BY b.name COLLATE NOCASE`,
    )
    .all<{
      id: number;
      name: string;
      slug: string;
      logo_url: string | null;
      product_count: number;
    }>();
  return (result.results ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    productCount: row.product_count,
  }));
}

export function safeJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
