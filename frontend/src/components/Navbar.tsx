export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">ShopHub</div>

        <div className="navbar-links">
          <button className="navbar-link-btn">Home</button>
          <button className="navbar-link-btn">Login</button>
          <button className="navbar-button">Register</button>
        </div>
      </div>
    </nav>
  );
}