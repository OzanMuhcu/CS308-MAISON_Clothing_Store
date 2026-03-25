import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const onSubmit = async (data: LoginFormValues) => {
    void data;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Sign In</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="login-field">
            <label className="login-label">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="login-input"
              placeholder="you@example.com"
            />
            {errors.email && <p className="login-error">{errors.email.message}</p>}
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="login-input"
              placeholder="********"
            />
            {errors.password && <p className="login-error">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="login-register-row">
          Don&apos;t have an account?{' '}
          <Link to="/login" className="login-register-link">
            Register
          </Link>
        </p>

        <div className="login-demo-box">
          <p className="login-demo-title">Demo Accounts (password: password123)</p>
          <p>Customer: customer@demo.com</p>
          <p>Sales Manager: sales@demo.com</p>
          <p>Product Manager: product@demo.com</p>
        </div>
      </div>
    </div>
  );
}
