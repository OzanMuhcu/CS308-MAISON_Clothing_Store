export default function HomePage() {
  const products = [
    {
      id: 1,
      name: 'Classic T-Shirt',
      price: 25,
      stock: 12,
      image:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 2,
      name: 'Casual Pants',
      price: 45,
      stock: 7,
      image:
        'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 3,
      name: 'Summer Shorts',
      price: 30,
      stock: 0,
      image:
        'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 4,
      name: 'Shirt',
      price: 40,
      stock: 5,
      image:
        'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const handleAddToCart = (productName: string) => {
    alert(`${productName} added to cart`);
  };

  return (
    <div className="home-page">
      <section className="hero">
        <h1>
          Welcome to <span>ShopHub</span>
        </h1>

        <p>
          A simple and professional online store where users can browse products,
          access login and registration features, and start shopping easily.
        </p>
      </section>

      <section className="products-preview">
        <h2>Featured Products</h2>
        <p className="products-subtitle">
          Browse a few clothing items and add them to your cart.
        </p>

        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image-wrapper">
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-image"
                />
              </div>

              <h3>{product.name}</h3>
              <p className="product-price">${product.price}</p>

              <p
                className={
                  product.stock > 0
                    ? 'stock-status in-stock'
                    : 'stock-status out-of-stock'
                }
              >
                {product.stock > 0
                  ? `In Stock (${product.stock})`
                  : 'Out of Stock'}
              </p>

              <button
                className="add-cart-btn"
                disabled={product.stock === 0}
                onClick={() => handleAddToCart(product.name)}
              >
                Add to Cart
              </button>
            </div>
          ))}
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