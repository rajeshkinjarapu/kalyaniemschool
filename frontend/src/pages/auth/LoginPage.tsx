import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { login as loginApi } from '../../api/auth';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, ArrowRight, GraduationCap } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
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
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

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
    <div className="h-screen w-screen overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-rose-500 relative font-sans">
      
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>

      {/* School Header */}
      <div className="relative z-10 flex flex-col items-center mb-6 sm:mb-8 mt-2">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(255,255,255,0.3)] border border-white/40">
          <GraduationCap className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-md" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white drop-shadow-lg tracking-tight text-center px-4">
          JY SCHOOL
        </h1>
        <p className="text-white/90 font-medium text-lg mt-1 tracking-wide uppercase drop-shadow-sm">Education ERP</p>
      </div>

      <div className="w-full max-w-sm sm:max-w-md bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-6 sm:p-8 border border-white/50 overflow-hidden relative z-10 mx-4 flex flex-col max-h-[60vh] sm:max-h-[65vh]">
        
        <div className="text-center mb-6 shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Student / Staff Login</h2>
          <p className="text-gray-500 text-sm font-medium">Please sign in to your account</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5 pb-2">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 ml-1">Username or Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder="Enter your username"
                  className={`w-full pl-11 pr-4 py-3 bg-gray-50/80 border-2 rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-0 focus:border-indigo-500 outline-none transition-all ${
                    errors.email ? 'border-red-400 focus:border-red-500' : 'border-gray-100 hover:border-gray-200'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`w-full pl-11 pr-12 py-3 bg-gray-50/80 border-2 rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-0 focus:border-indigo-500 outline-none transition-all ${
                    errors.password ? 'border-red-400 focus:border-red-500' : 'border-gray-100 hover:border-gray-200'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between pt-1 pb-1">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-colors" />
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-all">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-[1px] transition-all hover:shadow-[0_8px_25px_rgba(99,102,241,0.4)] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-all" />
              <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-8 py-3 rounded-[15px] text-white font-bold text-lg">
                {isSubmitting ? (
                  'Signing in...'
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>
        </div>
      </div>
      
      {/* Footer Text */}
      <div className="relative z-10 mt-6 sm:mt-8 text-center px-4 shrink-0">
        <p className="text-white/80 font-medium text-sm drop-shadow-sm">
          Having trouble logging in? <Link to="/register" className="font-bold text-white hover:underline transition-all">Contact Administrator</Link>
        </p>
        <p className="text-white/60 text-xs mt-2">&copy; {new Date().getFullYear()} JY Education. All rights reserved.</p>
      </div>
    </div>
  );
};
export default LoginPage;
