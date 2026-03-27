import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import WishlistPage from './pages/WishlistPage';
import DiscountsPage from './pages/DiscountsPage';
import InvoicesPage from './pages/InvoicesPage';
import RevenuePage from './pages/RevenuePage';
import RefundsPage from './pages/RefundsPage';
import CategoryManagementPage from './pages/CategoryManagementPage';
import ProductManagementPage from './pages/ProductManagementPage';
import ReviewModerationPage from './pages/ReviewModerationPage';
import DeliveryManagementPage from './pages/DeliveryManagementPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              {/* Public */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/products" element={<ProductListPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              {/* Req 4: Cart accessible without login (guest cart) */}
              <Route path="/cart" element={<CartPage />} />

              {/* Customer */}
              <Route path="/orders" element={<ProtectedRoute roles={['customer', 'sales_manager', 'product_manager']}><OrdersPage /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute roles={['customer', 'sales_manager', 'product_manager']}><OrderDetailPage /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute roles={['customer']}><WishlistPage /></ProtectedRoute>} />

              {/* Sales Manager */}
              <Route path="/discounts" element={<ProtectedRoute roles={['sales_manager']}><DiscountsPage /></ProtectedRoute>} />
              <Route path="/invoices" element={<ProtectedRoute roles={['sales_manager', 'product_manager']}><InvoicesPage /></ProtectedRoute>} />
              <Route path="/revenue" element={<ProtectedRoute roles={['sales_manager']}><RevenuePage /></ProtectedRoute>} />
              <Route path="/refunds" element={<ProtectedRoute roles={['sales_manager']}><RefundsPage /></ProtectedRoute>} />

              {/* Product Manager */}
              <Route path="/manage/categories" element={<ProtectedRoute roles={['product_manager']}><CategoryManagementPage /></ProtectedRoute>} />
              <Route path="/manage/products" element={<ProtectedRoute roles={['product_manager']}><ProductManagementPage /></ProtectedRoute>} />
              <Route path="/manage/reviews" element={<ProtectedRoute roles={['product_manager']}><ReviewModerationPage /></ProtectedRoute>} />
              <Route path="/manage/deliveries" element={<ProtectedRoute roles={['product_manager']}><DeliveryManagementPage /></ProtectedRoute>} />

              <Route path="*" element={<div className="text-center py-20 text-gray-500"><h1 className="text-4xl font-bold mb-2">404</h1><p>Page not found</p></div>} />
            </Routes>
          </main>
        </div>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
