export default function Contact() {
  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-8 py-20">
      <h1 className="font-display text-4xl text-brand-900 font-semibold mb-6">Contact Us</h1>
      <p className="text-base text-brand-600 leading-relaxed mb-4">
        Have a question about your order or our collection? Reach out to our customer care team for fast support.
      </p>
      <p className="text-base text-brand-600 leading-relaxed">
        Email us at{' '}
        <a href="mailto:support@maison.com" className="text-brand-900 font-semibold">
          support@maison.com
        </a>{' '}
        and we will respond within one business day.
      </p>
    </div>
  );
}
