import { useAuth } from "../context/AuthContext";

export default function Account() {
  const { user } = useAuth();

  if (!user) return null;

  const roleLabels: Record<string, string> = {
    customer: "Customer",
    sales_manager: "Sales Manager",
    product_manager: "Product Manager",
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <p className="text-xs tracking-[0.2em] uppercase text-brand-400 mb-2">
        Account
      </p>
      <h1 className="font-display text-3xl font-semibold text-brand-900 mb-10">
        My Account
      </h1>

      <div className="border border-brand-200 divide-y divide-brand-200">
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-xs tracking-widest uppercase text-brand-500 font-medium">
            Name
          </span>
          <span className="text-sm text-brand-900">{user.name}</span>
        </div>
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-xs tracking-widest uppercase text-brand-500 font-medium">
            Email
          </span>
          <span className="text-sm text-brand-900">{user.email}</span>
        </div>
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-xs tracking-widest uppercase text-brand-500 font-medium">
            Role
          </span>
          <span className="text-sm text-brand-900">
            {roleLabels[user.role] || user.role}
          </span>
        </div>
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-xs tracking-widest uppercase text-brand-500 font-medium">
            Member Since
          </span>
          <span className="text-sm text-brand-900">
            {new Date(user.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      <p className="mt-8 text-xs text-brand-400">
        Additional account features such as order history, address management,
        and preferences will be available in upcoming releases.
      </p>
    </div>
  );
}
