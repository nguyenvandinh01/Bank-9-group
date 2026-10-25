import { describe, expect, it } from "vitest";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  buildVietQrUrl,
  formatVND,
  normalizePhone,
  normalizeSearch,
  slugify,
} from "../src/shared/constants";

describe("normalizePhone", () => {
  it("keeps a local number", () => {
    expect(normalizePhone("0901234567")).toBe("0901234567");
  });

  it("converts +84 to the local prefix", () => {
    expect(normalizePhone("+84 901 234 567")).toBe("0901234567");
    expect(normalizePhone("84901234567")).toBe("0901234567");
  });

  it("strips spaces, dots and dashes", () => {
    expect(normalizePhone("090.123.4567")).toBe("0901234567");
    expect(normalizePhone("090-123-4567")).toBe("0901234567");
  });
});

describe("normalizeSearch", () => {
  it("removes Vietnamese diacritics", () => {
    expect(normalizeSearch("Điện thoại iPhone")).toBe("dien thoai iphone");
    expect(normalizeSearch("Máy tính bảng")).toBe("may tinh bang");
  });

  it("replaces punctuation and collapses whitespace", () => {
    expect(normalizeSearch("  Tai nghe   Bluetooth 5.3! ")).toBe("tai nghe bluetooth 5 3");
  });
});

describe("slugify", () => {
  it("creates a URL friendly slug", () => {
    expect(slugify("Tai nghe Bluetooth 5.3")).toBe("tai-nghe-bluetooth-5-3");
    expect(slugify("Điện thoại iPhone 15 Pro Max")).toBe("dien-thoai-iphone-15-pro-max");
  });
});

describe("formatVND", () => {
  it("formats VND with thousands separators and the currency suffix", () => {
    const formatted = formatVND(19990000);
    expect(formatted).toContain("19.990.000");
    expect(formatted).toContain("₫");
  });

  it("rounds decimal values", () => {
    expect(formatVND(1234.6)).toContain("1.235");
  });
});

describe("buildVietQrUrl", () => {
  it("builds a VietQR image URL with bank, account and transfer info", () => {
    const url = new URL(
      buildVietQrUrl({
        bin: "970436",
        account: "0123456789",
        amount: 29990000,
        addInfo: "B9-DEMO-0001",
        accountName: "NGUYEN VAN A",
      }),
    );

    expect(url.host).toBe("img.vietqr.io");
    expect(url.pathname).toBe("/image/970436-0123456789-compact2.png");
    expect(url.searchParams.get("amount")).toBe("29990000");
    expect(url.searchParams.get("addInfo")).toBe("B9-DEMO-0001");
    expect(url.searchParams.get("accountName")).toBe("NGUYEN VAN A");
  });

  it("rounds the amount", () => {
    const url = new URL(
      buildVietQrUrl({
        bin: "970436",
        account: "0123456789",
        amount: 1000.7,
        addInfo: "X",
        accountName: "A",
      }),
    );
    expect(url.searchParams.get("amount")).toBe("1001");
  });
});

describe("order status metadata", () => {
  it("has a label for every status", () => {
    for (const status of ORDER_STATUSES) {
      expect(ORDER_STATUS_LABELS[status]).toBeTruthy();
    }
  });
});
