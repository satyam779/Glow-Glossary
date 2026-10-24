import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router';
import { LEGACY_REDIRECTS } from '../../shared/legacyRedirects.js';
import CartDrawer from './components/CartDrawer';
import { Nav } from './components/Chrome';
import Logo from './components/Logo';
import { CartProvider } from './context/CartContext';
import { useRouteScroll, useSmoothScroll } from './hooks/useScrollEffects';
import Home from './pages/Home';

const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const OurStoryPage = lazy(() => import('./pages/OurStoryPage'));
const RitualsPage = lazy(() => import('./pages/RitualsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ShippingPage = lazy(() => import('./pages/ShippingPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminApp = lazy(() => import('./admin/AdminApp'));

function PageLoading() {
  return (
    <div className="page-loading" aria-busy="true" aria-label="Loading">
      <Logo className="spin-logo" />
    </div>
  );
}

// Storefront chrome: nav, cart drawer, smooth scrolling, film grain.
function PublicLayout() {
  useSmoothScroll();
  useRouteScroll();
  return (
    <>
      <Nav />
      <CartDrawer />
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
      <div className="grain" aria-hidden="true" />
    </>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="shop/:slug" element={<ProductPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order/:id" element={<OrderPage />} />
          <Route path="our-story" element={<OurStoryPage />} />
          <Route path="rituals" element={<RitualsPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="shipping" element={<ShippingPage />} />
          {/* Old Shopify URLs (the server answers these with a 301 in production). */}
          {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from.slice(1)} element={<Navigate to={to} replace />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route
          path="admin/*"
          element={
            <Suspense fallback={<PageLoading />}>
              <AdminApp />
            </Suspense>
          }
        />
      </Routes>
    </CartProvider>
  );
}
