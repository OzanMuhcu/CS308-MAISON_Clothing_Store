export default function Footer() {
  return (
    <footer className="border-t border-brand-200 mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="font-display text-xl font-semibold text-brand-900 mb-3">MAISON</p>
            <p className="text-sm text-brand-500 leading-relaxed">
              Contemporary clothing crafted with intention. Quality materials,
              timeless design, built to last.
            </p>
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase font-medium text-brand-900 mb-3">Customer Care</p>
            <ul className="space-y-2 text-sm text-brand-500">
              <li>Shipping &amp; Returns</li>
              <li>Size Guide</li>
              <li>Contact Us</li>
            </ul>
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase font-medium text-brand-900 mb-3">Company</p>
            <ul className="space-y-2 text-sm text-brand-500">
              <li>About</li>
              <li>Sustainability</li>
              <li>Careers</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-brand-200 mt-10 pt-6 text-center">
          <p className="text-xs text-brand-400">CS 308 Software Engineering Project</p>
        </div>
      </div>
    </footer>
  );
}
