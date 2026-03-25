import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">ShopHub</Link>
          <Link to="/" className="navbar-nav-item">Products</Link>
          <Link to="/" className="navbar-nav-item navbar-cart-link">
            Cart
          </Link>
        </div>

        <div className="navbar-right">
          <Link to="/login" className="navbar-link-btn">Login</Link>
          <Link to="/register" className="navbar-button">Register</Link>
        </div>
      </div>
    </nav>
  );
}