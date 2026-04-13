import { Link } from "react-router-dom";

export default function Orders() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="font-display text-2xl lg:text-3xl font-semibold text-brand-900 mb-8">
        Order History
      </h1>

      <div className="border border-brand-200 p-12 text-center">
        <svg className="w-12 h-12 mx-auto mb-4 text-brand-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
        <p className="text-sm text-brand-600 mb-2">No orders yet</p>
        <p className="text-xs text-brand-400 mb-6 max-w-sm mx-auto leading-relaxed">
          Once you complete a purchase, your order details and tracking
          information will appear here.
        </p>
        <Link to="/" className="btn-primary">
          Start Shopping
        </Link>
      </div>
    </div>
  );
}
