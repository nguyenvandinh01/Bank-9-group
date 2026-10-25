const baseUrl = (process.env.BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const concurrency = Number.parseInt(process.env.CONCURRENCY ?? "5", 10);
const phone = "0900000001";
const address = "123 Duong Test, Quan 1, TP HCM";

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`GET ${path} -> ${response.status}`);
  }
  return (await response.json()).data;
}

async function findTarget() {
  const wanted = process.env.PRODUCT_SLUG;
  if (wanted) {
    const product = await getJson(`/api/products/${wanted}`);
    const variant = product.variants.find((item) => item.available >= 1);
    if (variant) return { product, variant };
  }

  const list = await getJson("/api/products?pageSize=48");
  for (const card of list.items) {
    if (card.available < 1 || card.available > 2) continue;
    const product = await getJson(`/api/products/${card.slug}`);
    const variant = product.variants.find((item) => item.available === 1);
    if (variant) return { product, variant };
  }
  return null;
}

async function checkout(variantId, key) {
  const response = await fetch(`${baseUrl}/api/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify({
      customerName: "Oversell Test",
      phone,
      address,
      paymentMethod: "cod",
      items: [{ variantId, qty: 1 }],
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { status: response.status, payload };
}

async function main() {
  const target = await findTarget();
  if (!target) {
    console.log("SKIP: no product variant with exactly 1 unit available.");
    console.log("Run `npm run db:reset:local` then `npm run db:seed:local` to restore demo stock.");
    return;
  }

  const { product, variant } = target;
  console.log(
    `Target: ${product.name} / ${variant.name} (variant ${variant.id}), available=${variant.available}`,
  );

  const stamp = Date.now().toString(36);
  const results = await Promise.all(
    Array.from({ length: concurrency }, (_, index) =>
      checkout(variant.id, `oversell-${stamp}-${index}`),
    ),
  );

  const successes = results.filter((result) => result.status === 201);
  const conflicts = results.filter(
    (result) => result.status === 409 && result.payload?.error?.code === "OUT_OF_STOCK",
  );
  const unexpected = results.filter(
    (result) => result.status !== 201 && result.status !== 409,
  );

  console.log(
    `Requests: ${results.length}, created: ${successes.length}, sold out: ${conflicts.length}, unexpected: ${unexpected.length}`,
  );

  if (unexpected.length > 0) {
    for (const result of unexpected) {
      console.log(`  unexpected ${result.status}: ${JSON.stringify(result.payload)}`);
    }
  }

  let failed = false;
  if (successes.length !== 1) {
    console.error(`FAIL: expected exactly 1 successful order, got ${successes.length}`);
    failed = true;
  }
  if (conflicts.length !== concurrency - 1) {
    console.error(`FAIL: expected ${concurrency - 1} OUT_OF_STOCK responses, got ${conflicts.length}`);
    failed = true;
  }
  if (unexpected.length > 0) failed = true;

  const created = successes[0]?.payload?.data?.code;
  if (created) {
    const cancelResponse = await fetch(`${baseUrl}/api/orders/${created}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    console.log(`Cleanup ${created}: cancel -> ${cancelResponse.status}`);

    const after = await getJson(`/api/products/${product.slug}`);
    const available = after.variants.find((item) => item.id === variant.id)?.available;
    if (available !== variant.available) {
      console.error(
        `FAIL: expected available=${variant.available} after cleanup, got ${available}`,
      );
      failed = true;
    } else {
      console.log(`Stock restored: available=${available}`);
    }
  }

  if (failed) process.exitCode = 1;
  else console.log("PASS: concurrent checkout allowed only one order for the last unit.");
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  console.error("Is the dev server running at " + baseUrl + "? Try `npm run dev`.");
  process.exitCode = 1;
});
