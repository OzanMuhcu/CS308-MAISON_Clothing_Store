import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, guestCart } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };
  const cartCount = guestCart.reduce((s, i) => s + i.quantity, 0);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-indigo-600">ShopHub</Link>
            <div className="hidden md:flex gap-4">
              <Link to="/products" className="text-gray-700 hover:text-indigo-600 transition">Products</Link>
              {/* Req 4: anyone can see cart (guest cart) */}
              <Link to="/cart" className="text-gray-700 hover:text-indigo-600 transition">
                Cart{!user && cartCount > 0 && <span className="ml-1 bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">{cartCount}</span>}
              </Link>
              {user?.role === 'customer' && (
                <>
                  <Link to="/wishlist" className="text-gray-700 hover:text-indigo-600 transition">Wishlist</Link>
                  <Link to="/orders" className="text-gray-700 hover:text-indigo-600 transition">Orders</Link>
                </>
              )}
              {user?.role === 'sales_manager' && (
                <>
                  <Link to="/discounts" className="text-gray-700 hover:text-indigo-600 transition">Discounts</Link>
                  <Link to="/invoices" className="text-gray-700 hover:text-indigo-600 transition">Invoices</Link>
                  <Link to="/revenue" className="text-gray-700 hover:text-indigo-600 transition">Revenue</Link>
                  <Link to="/refunds" className="text-gray-700 hover:text-indigo-600 transition">Refunds</Link>
                </>
              )}
              {user?.role === 'product_manager' && (
                <>
                  <Link to="/manage/categories" className="text-gray-700 hover:text-indigo-600 transition">Categories</Link>
                  <Link to="/manage/products" className="text-gray-700 hover:text-indigo-600 transition">Products</Link>
                  <Link to="/manage/reviews" className="text-gray-700 hover:text-indigo-600 transition">Reviews</Link>
                  <Link to="/manage/deliveries" className="text-gray-700 hover:text-indigo-600 transition">Deliveries</Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">{user.name}{' '}
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{user.role.replace('_', ' ')}</span>
                </span>
                <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800 transition">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-700 hover:text-indigo-600 transition">Login</Link>
                <Link to="/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
