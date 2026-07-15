import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { login as loginApi } from '../../api/auth';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, ShieldAlert } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(3, 'Please enter your email, Student ID or registered mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const handleQuickLogin = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
  };

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await loginApi(values);
      const { accessToken, refreshToken, user } = response.data;
      login(accessToken, refreshToken, user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(from, { replace: true });
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Left panel (illustrations & text) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-teal-600 items-center justify-center p-12 text-white relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-teal-500/20 blur-3xl" />

        <div className="max-w-md space-y-6 relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-white font-bold text-2xl border border-white/20">
            R
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-extrabold tracking-tight">JY SCHOOL</h2>
            <p className="text-lg text-white/80">
              Welcome to the Springfield Campus Student Management System. Track grades, attendance, payments and announcements in real-time.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <h3 className="font-bold text-lg">Real-time</h3>
              <p className="text-sm text-white/70 mt-1">Instant chat & push notifications for parents and staff.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <h3 className="font-bold text-lg">Analytical</h3>
              <p className="text-sm text-white/70 mt-1">Performant grade trends and enrollment insights charts.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel (form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Sign In</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Enter your credentials to access your academic portal.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email, Student ID or Mobile Number</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="name@school.com, JY26-0001 or 9876543210"
                  className={`input pl-11 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="label mb-0">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input pl-11 pr-11 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
