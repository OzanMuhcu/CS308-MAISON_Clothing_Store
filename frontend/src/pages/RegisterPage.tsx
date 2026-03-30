import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

interface Form { name: string; email: string; password: string; confirmPassword: string; taxId: string; homeAddress: string; }

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Form>();

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try { 
      await registerUser(data.name, data.email, data.password, data.taxId, data.homeAddress);
      console.log('Registration Data:', data);
      toast.success('Account created!'); 
      navigate('/'); 
    }
    catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Registration failed';
      toast.error(message);
    }
    finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h1 className="register-title">Create Account</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="register-form">
          <div className="register-field">
            <label className="register-label">Full Name *</label>
            <input {...register('name', { required: 'Name is required' })} className="register-input" />
            {errors.name && <p className="register-error">{errors.name.message}</p>}
          </div>
          <div className="register-field">
            <label className="register-label">Email *</label>
            <input type="email" {...register('email', { required: 'Email is required' })} className="register-input" />
            {errors.email && <p className="register-error">{errors.email.message}</p>}
          </div>
          <div className="register-field">
            <label className="register-label">Tax ID</label>
            <input {...register('taxId')} className="register-input" placeholder="Optional" />
          </div>
          <div className="register-field">
            <label className="register-label">Home Address</label>
            <input {...register('homeAddress')} className="register-input" placeholder="Optional" />
          </div>
          <div className="register-field">
            <label className="register-label">Password *</label>
            <input type="password" {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })} className="register-input" />
            {errors.password && <p className="register-error">{errors.password.message}</p>}
          </div>
          <div className="register-field">
            <label className="register-label">Confirm Password *</label>
            <input type="password" {...register('confirmPassword', { validate: (v) => v === watch('password') || 'Passwords do not match' })} className="register-input" />
            {errors.confirmPassword && <p className="register-error">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="register-button">{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
        <p className="register-login-row">Already have an account? <Link to="/login" className="register-login-link">Sign in</Link></p>
      </div>
    </div>
  );
}