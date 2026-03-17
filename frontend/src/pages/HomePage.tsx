export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero">
        <h1>
          Welcome to <span>ShopHub</span>
        </h1>

        <p>
          A simple and professional online store landing page where users can
          access login and registration features easily.
        </p>

        <div className="hero-buttons">
          <button className="primary-btn">Login</button>
          <button className="secondary-btn">Register</button>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <h3>Easy Access</h3>
          <p>Users can quickly find login and registration options.</p>
        </div>

        <div className="feature-card">
          <h3>Clean Interface</h3>
          <p>The platform provides a simple and professional first impression.</p>
        </div>

        <div className="feature-card">
          <h3>Responsive Design</h3>
          <p>The landing page adapts well to different screen sizes.</p>
        </div>
      </section>

      <footer className="footer">
        <p>© 2026 ShopHub. All rights reserved.</p>
        <p>A simple and professional online store interface.</p>
      </footer>
    </div>
  );
}