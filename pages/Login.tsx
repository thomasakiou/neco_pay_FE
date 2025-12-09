import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, CheckSquare } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">

          {/* Left Branding Panel */}
          <div className="hidden md:flex flex-col items-start justify-center p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">N</div>
              <h2 className="text-3xl font-bold text-gray-900">NECO Payment Manager</h2>
            </div>
            <p className="text-xl text-gray-600">
              Secure, efficient, and reliable financial processing to simplify your payment management.
            </p>
            <div className="w-full pt-4">
              <div className="aspect-[4/3] w-full rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 border border-primary-100 shadow-sm flex items-center justify-center">
                <img src="/images/neco.png" alt="NECO Logo" className="rounded-xl opacity-80 mix-blend-multiply" />
              </div>
            </div>
          </div>

          {/* Right Login Form */}
          <div className="w-full max-w-md mx-auto bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h1>
              <p className="text-gray-500">Welcome back! Please enter your details.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  className="w-full h-12 px-4 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full h-12 px-4 pr-12 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                  />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                  <span className="text-sm text-gray-600">Remember Me</span>
                </label>
                <a href="#" className="text-sm font-medium text-primary-600 hover:underline">Forgot Password?</a>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-sm focus:ring-4 focus:ring-primary-100"
              >
                Login
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Need help? <a href="#" className="font-medium text-primary-600 hover:underline">Contact Support</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 w-full text-center">
        <p className="text-xs text-gray-400">© 2024 NECO Payment Management. All Rights Reserved.</p>
      </div>
    </div>
  );
}