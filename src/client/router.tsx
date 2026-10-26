import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { PageLoader } from "./components/ui";

const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const ProductsPage = lazy(() => import("./pages/ProductsPage").then((m) => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import("./pages/CartPage").then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage").then((m) => ({ default: m.CheckoutPage })));
const OrderPage = lazy(() => import("./pages/OrderPage").then((m) => ({ default: m.OrderPage })));
const OrderLookupPage = lazy(() => import("./pages/OrderLookupPage").then((m) => ({ default: m.OrderLookupPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

const AdminLoginPage = lazy(() => import("./admin/LoginPage").then((m) => ({ default: m.AdminLoginPage })));
const AdminLayout = lazy(() => import("./admin/AdminLayout").then((m) => ({ default: m.AdminLayout })));
const AdminDashboardPage = lazy(() => import("./admin/DashboardPage").then((m) => ({ default: m.AdminDashboardPage })));
const AdminProductsPage = lazy(() => import("./admin/ProductsPage").then((m) => ({ default: m.AdminProductsPage })));
const AdminProductEditPage = lazy(() => import("./admin/ProductEditPage").then((m) => ({ default: m.AdminProductEditPage })));
const AdminOrdersPage = lazy(() => import("./admin/OrdersPage").then((m) => ({ default: m.AdminOrdersPage })));
const AdminOrderDetailPage = lazy(() => import("./admin/OrderDetailPage").then((m) => ({ default: m.AdminOrderDetailPage })));
const AdminTaxonomyPage = lazy(() => import("./admin/TaxonomyPage").then((m) => ({ default: m.AdminTaxonomyPage })));
const AdminSettingsPage = lazy(() => import("./admin/SettingsPage").then((m) => ({ default: m.AdminSettingsPage })));

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: "san-pham", element: withSuspense(<ProductsPage />) },
      { path: "san-pham/:slug", element: withSuspense(<ProductDetailPage />) },
      { path: "gio-hang", element: withSuspense(<CartPage />) },
      { path: "thanh-toan", element: withSuspense(<CheckoutPage />) },
      { path: "don-hang/:code", element: withSuspense(<OrderPage />) },
      { path: "tra-cuu-don", element: withSuspense(<OrderLookupPage />) },
      { path: "*", element: withSuspense(<NotFoundPage />) },
    ],
  },
  { path: "admin/login", element: withSuspense(<AdminLoginPage />) },
  {
    path: "admin",
    element: withSuspense(<AdminLayout />),
    children: [
      { index: true, element: withSuspense(<AdminDashboardPage />) },
      { path: "san-pham", element: withSuspense(<AdminProductsPage />) },
      { path: "san-pham/:id", element: withSuspense(<AdminProductEditPage />) },
      { path: "don-hang", element: withSuspense(<AdminOrdersPage />) },
      { path: "don-hang/:code", element: withSuspense(<AdminOrderDetailPage />) },
      { path: "danh-muc", element: withSuspense(<AdminTaxonomyPage />) },
      { path: "cai-dat", element: withSuspense(<AdminSettingsPage />) },
    ],
  },
]);
