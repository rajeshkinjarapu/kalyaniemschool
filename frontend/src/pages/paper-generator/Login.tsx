import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/latex-api';
import { GraduationCap, Shield, User, Lock, ArrowRight, BookOpen } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'TEACHER', // DEFAULT
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        const res = await api.register(formData);
        localStorage.setItem('jee_token', res.token);
        localStorage.setItem('jee_user', JSON.stringify(res.user));
      } else {
        const res = await api.login({
          username: formData.username,
          password: formData.password,
        });
        localStorage.setItem('jee_token', res.token);
        localStorage.setItem('jee_user', JSON.stringify(res.user));
      }
      // Redirect to dashboard
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Soft background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accentPurple/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 via-accentPurple to-teal-500 rounded-2xl flex items-center justify-center shadow-neon mb-4 transform hover:rotate-12 transition-transform duration-300">
            <BookOpen className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-accentPurple to-teal-500">
              JEE Mains
            </span>{' '}
            Paper Builder
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-sans">
            LaTeX-Quality Exam compiler for Educators
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg">
          <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
            {isRegistering ? 'Create Educator Account' : 'Educator Sign In'}
          </h2>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm flex items-start gap-2">
              <span className="font-bold text-red-600">Error:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="enter username"
                  className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 focus:outline-none focus:border-indigo-600 transition-colors text-sm font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 focus:outline-none focus:border-indigo-600 transition-colors text-sm font-sans"
                />
              </div>
            </div>

            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Assign System Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: 'TEACHER' }))}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      formData.role === 'TEACHER'
                        ? 'border-indigo-600 bg-indigo-600/10 text-indigo-600'
                        : 'border-slate-300 bg-slate-50 text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    <GraduationCap className="w-5 h-5" />
                    <span className="text-xs font-bold">Teacher</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: 'ADMIN' }))}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      formData.role === 'ADMIN'
                        ? 'border-teal-500 bg-teal-500/10 text-teal-500'
                        : 'border-slate-300 bg-slate-50 text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                    <span className="text-xs font-bold">Administrator</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-accentPurple hover:brightness-110 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-md transition-all hover:gap-3 disabled:opacity-50"
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  <span>{isRegistering ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle login vs register */}
          <div className="mt-6 text-center text-sm font-sans text-slate-500">
            {isRegistering ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-indigo-600 hover:underline font-bold"
                >
                  Log In
                </button>
              </p>
            ) : (
              <p>
                New educator/admin?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-teal-500 hover:underline font-bold"
                >
                  Create Account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


