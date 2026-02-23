'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Wrench, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Gauge, Package, BarChart3 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f4f8' }}>
        <div className="spinner w-10 h-10"></div>
      </div>
    );
  }

  const features = [
    { icon: Shield, label: 'Job Cards & Tracking' },
    { icon: Package, label: 'Inventory Management' },
    { icon: Gauge, label: 'Service Tokens' },
    { icon: BarChart3, label: 'Reports & Analytics' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div
        className="hidden lg:flex lg:w-[45%] p-12 flex-col justify-between relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0f1729 0%, #0a2a2e 40%, #003330 100%)',
        }}
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #00b4d8, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.05]"
            style={{ background: 'radial-gradient(circle, #00b4d8, transparent 70%)' }}
          />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #00b4d8 0%, #0096c7 100%)',
                boxShadow: '0 4px 16px rgba(4, 201, 171, 0.35)',
              }}
            >
              <Wrench className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-display">
                {process.env.NEXT_PUBLIC_GARAGE_NAME || 'Auto Garage'}
              </h1>
              <p className="text-xs font-medium tracking-wide uppercase" style={{ color: '#00b4d8' }}>
                Service Centre
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight font-display">
              Complete Garage
              <br />
              <span style={{ color: '#00b4d8' }}>Management</span> Solution
            </h2>
            <p className="text-gray-400 text-base mt-4 max-w-md leading-relaxed">
              Streamline your garage operations with our all-in-one
              inventory, job tracking, and billing management system.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.label}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(4, 201, 171, 0.06)', border: '1px solid rgba(4, 201, 171, 0.1)' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(4, 201, 171, 0.12)' }}
                  >
                    <Icon size={16} style={{ color: '#00b4d8' }} />
                  </div>
                  <span className="text-sm text-gray-300 font-medium">{feature.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 text-gray-600 text-xs">
          © 2026 Auto Garage. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: '#f0f4f8' }}>
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #00b4d8 0%, #0096c7 100%)',
                boxShadow: '0 4px 12px rgba(4, 201, 171, 0.3)',
              }}
            >
              <Wrench className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 font-display">Auto Garage</h1>
              <p className="text-gray-500 text-xs">Service Centre</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl p-8 shadow-card border border-gray-100/80">
            <div className="text-center mb-7">
              <h2 className="text-2xl font-bold text-gray-900 font-display">Welcome back</h2>
              <p className="text-gray-500 mt-1.5 text-sm">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    className="input pl-11"
                    placeholder="admin@garage.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pl-11 pr-11"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 focus:ring-brand-500"
                    style={{ accentColor: '#00b4d8' }}
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm font-medium transition-colors"
                  style={{ color: '#00b4d8' }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #00b4d8 0%, #0096c7 100%)',
                  boxShadow: '0 4px 16px rgba(4, 201, 171, 0.35)',
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(4, 201, 171, 0.45)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(4, 201, 171, 0.35)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {loading ? (
                  <>
                    <div className="spinner w-5 h-5 border-white border-t-transparent"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Demo Credentials */}
          <div
            className="mt-5 p-4 rounded-xl border"
            style={{
              background: 'rgba(4, 201, 171, 0.04)',
              borderColor: 'rgba(4, 201, 171, 0.15)',
            }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: '#0096c7' }}>
              Demo Credentials
            </p>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                Email:{' '}
                <span
                  className="font-mono text-xs px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(4, 201, 171, 0.08)', color: '#0096c7' }}
                >
                  admin@garage.com
                </span>
              </p>
              <p>
                Password:{' '}
                <span
                  className="font-mono text-xs px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(4, 201, 171, 0.08)', color: '#0096c7' }}
                >
                  admin123
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
