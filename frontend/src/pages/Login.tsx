import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setServerError("");
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      navigate("/");
    } catch (err: any) {
      setServerError(
        err.response?.data?.error || "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-semibold text-brand-900">
            Sign In
          </h1>
          <p className="mt-2 text-sm text-brand-500">
            Enter your credentials to access your account.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {serverError}
            </div>
          )}

          <div>
            <label htmlFor="email" className="input-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input-field"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email",
                },
              })}
            />
            {errors.email && (
              <p className="input-error">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="input-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="input-field"
              {...register("password", {
                required: "Password is required",
              })}
            />
            {errors.password && (
              <p className="input-error">{errors.password.message}</p>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-brand-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-brand-900 font-medium underline underline-offset-2 hover:text-brand-700"
          >
            Create one
          </Link>
        </p>

        <div className="mt-10 border-t border-brand-200 pt-6">
          <p className="text-xs text-brand-400 text-center mb-2">Demo Accounts</p>
          <div className="text-xs text-brand-500 text-center space-y-0.5">
            <p>customer@demo.com / password123</p>
            <p>sales@demo.com / password123</p>
            <p>product@demo.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
