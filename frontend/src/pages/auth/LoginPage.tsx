import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { login as loginApi } from '../../api/auth';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden relative">
        {/* Top Wave Background */}
        <div className="absolute top-0 left-0 w-full h-[250px] bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 rounded-b-[40%] scale-x-125 translate-x-[-10%] origin-top"></div>
        
        <div className="relative z-10 flex flex-col items-center pt-16 px-8 pb-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-2 transform rotate-45">
              <div className="w-8 h-8 bg-white rounded-lg -rotate-45 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xl">V</span>
              </div>
            </div>
            <h1 className="text-white text-xl font-bold tracking-wider">MOFINOW</h1>
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Welcome <span className="font-normal text-gray-600">back !</span>
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
            <div>
              <input
                type="text"
                placeholder="Username"
                className={`w-full px-6 py-4 bg-gray-50 border-none rounded-full text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none ${errors.email ? 'ring-2 ring-red-500' : ''}`}
                {...register('email')}
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className={`w-full px-6 py-4 bg-gray-50 border-none rounded-full text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none pr-12 ${errors.password ? 'ring-2 ring-red-500' : ''}`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm px-2">
              <label className="flex items-center text-gray-500 cursor-pointer">
                <input type="checkbox" className="mr-2 rounded-full border-gray-300 text-blue-500 focus:ring-blue-500 w-4 h-4" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-gray-500 hover:text-gray-700">
                Forget password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 mt-4 bg-white text-blue-600 font-semibold rounded-full border border-blue-500 hover:bg-blue-50 transition-colors"
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500">
            New user? <Link to="/register" className="text-blue-600 font-semibold hover:underline">Sign Up</Link>
          </p>

          <p className="text-xs text-gray-400">
            Sign in with your credentials
          </p>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
