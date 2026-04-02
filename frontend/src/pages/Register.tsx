import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const passwordValue = watch("password", "");

  const onSubmit = async (data: RegisterForm) => {
    setServerError("");
    setSubmitting(true);
    try {
      await registerUser(data.name, data.email, data.password);
      navigate("/");
    } catch (err: any) {
      setServerError(
        err.response?.data?.error || "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Password strength indicators
  const hasMinLength = passwordValue.length >= 8;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-semibold text-brand-900">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-brand-500">
            Join us to start shopping and track your orders.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {serverError}
            </div>
          )}

          <div>
            <label htmlFor="name" className="input-label">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className="input-field"
              {...register("name", {
                required: "Name is required",
                maxLength: { value: 100, message: "Name is too long" },
              })}
            />
            {errors.name && (
              <p className="input-error">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="reg-email" className="input-label">
              Email Address
            </label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password" className="input-label">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              className="input-field"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
            />
            {errors.password && (
              <p className="input-error">{errors.password.message}</p>
            )}

            {/* Password rules */}
            <div className="mt-2 space-y-1">
              <p
                className={`text-xs transition-colors ${
                  hasMinLength ? "text-green-600" : "text-brand-400"
                }`}
              >
                {hasMinLength ? "\u2713" : "\u2022"} At least 8 characters
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="input-label">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="input-field"
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (val) =>
                  val === passwordValue || "Passwords do not match",
              })}
            />
            {errors.confirmPassword && (
              <p className="input-error">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-brand-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-brand-900 font-medium underline underline-offset-2 hover:text-brand-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
