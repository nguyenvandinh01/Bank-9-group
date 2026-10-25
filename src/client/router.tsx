import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderPage } from "./pages/OrderPage";
import { OrderLookupPage } from "./pages/OrderLookupPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AdminLayout } from "./admin/AdminLayout";
import { AdminLoginPage } from "./admin/LoginPage";
import { AdminDashboardPage } from "./admin/DashboardPage";
import { AdminProductsPage } from "./admin/ProductsPage";
import { AdminProductEditPage } from "./admin/ProductEditPage";
import { AdminOrdersPage } from "./admin/OrdersPage";
import { AdminOrderDetailPage } from "./admin/OrderDetailPage";
import { AdminTaxonomyPage } from "./admin/TaxonomyPage";
import { AdminSettingsPage } from "./admin/SettingsPage";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "san-pham", element: <ProductsPage /> },
      { path: "san-pham/:slug", element: <ProductDetailPage /> },
      { path: "gio-hang", element: <CartPage /> },
      { path: "thanh-toan", element: <CheckoutPage /> },
      { path: "don-hang/:code", element: <OrderPage /> },
      { path: "tra-cuu-don", element: <OrderLookupPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  { path: "admin/login", element: <AdminLoginPage /> },
  {
    path: "admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "san-pham", element: <AdminProductsPage /> },
      { path: "san-pham/:id", element: <AdminProductEditPage /> },
      { path: "don-hang", element: <AdminOrdersPage /> },
      { path: "don-hang/:code", element: <AdminOrderDetailPage /> },
      { path: "danh-muc", element: <AdminTaxonomyPage /> },
      { path: "cai-dat", element: <AdminSettingsPage /> },
    ],
  },
]);
