import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const products = [
  { file: "iphone-15-pro-max", label: "iPhone 15 Pro Max", sub: "Titanium", from: "#4b5563", to: "#111827" },
  { file: "iphone-15", label: "iPhone 15", sub: "Dynamic Island", from: "#60a5fa", to: "#1d4ed8" },
  { file: "galaxy-s24-ultra", label: "Galaxy S24 Ultra", sub: "Galaxy AI", from: "#475569", to: "#0f172a" },
  { file: "galaxy-a55", label: "Galaxy A55 5G", sub: "Awesome", from: "#38bdf8", to: "#1e3a8a" },
  { file: "xiaomi-14", label: "Xiaomi 14", sub: "Leica", from: "#f97316", to: "#7c2d12" },
  { file: "redmi-note-13-pro", label: "Redmi Note 13 Pro", sub: "200MP", from: "#a855f7", to: "#4c1d95" },
  { file: "oppo-reno11", label: "OPPO Reno11", sub: "Portrait", from: "#34d399", to: "#065f46" },
  { file: "pixel-8", label: "Google Pixel 8", sub: "Tensor G3", from: "#facc15", to: "#713f12" },
  { file: "macbook-air-m3", label: "MacBook Air M3", sub: "13 inch", from: "#94a3b8", to: "#1e293b" },
  { file: "macbook-pro-14", label: "MacBook Pro 14", sub: "M3 Pro", from: "#64748b", to: "#020617" },
  { file: "dell-xps-13", label: "Dell XPS 13 Plus", sub: "3.5K OLED", from: "#38bdf8", to: "#0c4a6e" },
  { file: "asus-rog-g14", label: "ROG Zephyrus G14", sub: "RTX 4060", from: "#ef4444", to: "#450a0a" },
  { file: "thinkpad-x1", label: "ThinkPad X1 Carbon", sub: "Gen 11", from: "#334155", to: "#000000" },
  { file: "hp-spectre", label: "HP Spectre x360", sub: "2.8K OLED", from: "#818cf8", to: "#312e81" },
  { file: "acer-aspire", label: "Acer Aspire 5", sub: "Office", from: "#a3a3a3", to: "#404040" },
  { file: "msi-katana", label: "MSI Katana 15", sub: "RTX 4050", from: "#fb7185", to: "#881337" },
  { file: "pc-rtx-4060", label: "PC Gaming RTX 4060", sub: "Ryzen 5", from: "#22d3ee", to: "#164e63" },
  { file: "pc-rtx-4070", label: "PC Gaming RTX 4070", sub: "Super", from: "#4ade80", to: "#14532d" },
  { file: "pc-office", label: "PC Văn phòng i5", sub: "16GB RAM", from: "#cbd5e1", to: "#334155" },
  { file: "pc-graphics", label: "PC Đồ họa Ryzen 7", sub: "RTX 4060 Ti", from: "#c084fc", to: "#581c87" },
  { file: "imac-24", label: "iMac 24 inch", sub: "M3", from: "#67e8f9", to: "#155e75" },
  { file: "mac-mini", label: "Mac mini M2", sub: "Compact", from: "#d1d5db", to: "#4b5563" },
  { file: "pc-workstation", label: "PC Workstation", sub: "RTX 4090", from: "#fbbf24", to: "#78350f" },
  { file: "mini-pc", label: "Mini PC NUC", sub: "Small form", from: "#94a3b8", to: "#0f172a" },
];

const outDir = resolve("public/seed");
mkdirSync(outDir, { recursive: true });

for (const p of products) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="${p.label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.from}"/>
      <stop offset="100%" stop-color="${p.to}"/>
    </linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <circle cx="640" cy="160" r="190" fill="#ffffff" opacity="0.08"/>
  <circle cx="160" cy="660" r="230" fill="#000000" opacity="0.14"/>
  <rect x="90" y="90" width="620" height="620" rx="48" fill="url(#gloss)" opacity="0.25"/>
  <text x="400" y="380" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="52" font-weight="700" fill="#ffffff">${p.label}</text>
  <text x="400" y="446" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="30" fill="#ffffff" opacity="0.8">${p.sub}</text>
  <text x="400" y="620" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="26" letter-spacing="6" fill="#ffffff" opacity="0.55">BANK9 TECH</text>
</svg>
`;
  writeFileSync(resolve(outDir, `${p.file}.svg`), svg, "utf8");
}

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0f172a"/>
  <path d="M18 18h14c7 0 11 3 11 8 0 3-2 6-5 7 4 1 6 4 6 8 0 6-5 9-12 9H18V18zm12 13c3 0 5-1 5-4s-2-4-5-4h-5v8h5zm1 14c4 0 6-2 6-5s-2-5-6-5h-6v10h6z" fill="#22d3ee"/>
</svg>
`;
writeFileSync(resolve("public/favicon.svg"), favicon, "utf8");

console.log(`Generated ${products.length} product images and favicon.`);
