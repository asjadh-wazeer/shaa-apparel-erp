import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useLoginMutation } from '../api/auth.api';
import { loginSchema, LoginFormValues } from '../schemas/login.schema';
import { setCredentials } from '../store/auth.slice';
import { useAppDispatch, useAppSelector } from '../../../store';
import { ROUTES } from '../../../shared/constants';

const ROLE_OPTIONS = [
  'CEO & Founder',
  'General Manager',
  'Tenant Admin',
  'HR Executive',
  'Head Office Accountant',
  'Showroom Accountant',
  'Finance & Payroll',
  'Fashion Designer',
  'Head Pattern Maker',
  'Digital Pattern Maker',
  'Sample Maker',
  'Graphic Designer',
  'Storekeeper',
  'Cutting Supervisor',
  'Cutting Verifier',
  'Sewing Supervisor',
  'QC Inspector',
  'QA Approver',
  'Production Manager',
  'Sales Staff',
];

export function LoginPage(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [credentialError, setCredentialError] = useState(false);

  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />;

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setCredentialError(false);
    try {
      const result = await login(values).unwrap();
      const { user, accessToken, refreshToken } = result.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; status?: number };
      if (error?.status === 401 || error?.data?.message?.includes('Invalid')) {
        setCredentialError(true);
      } else {
        toast.error(error?.data?.message ?? 'Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — blue */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1D4ED8 50%, #1e3a8a 100%)' }}
      >
        {/* Decorative fabric grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="fabricGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                <circle cx="0" cy="0" r="2" fill="white" />
                <circle cx="40" cy="0" r="2" fill="white" />
                <circle cx="0" cy="40" r="2" fill="white" />
                <circle cx="20" cy="20" r="1.5" fill="white" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#fabricGrid)" />
          </svg>
        </div>

        {/* Diagonal stitching lines */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="stitching" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <line x1="0" y1="60" x2="60" y2="0" stroke="white" strokeWidth="1" strokeDasharray="4 4"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#stitching)" />
          </svg>
        </div>

        {/* Top-left brand */}
        <div className="relative z-10 px-10 pt-10">
          <p className="text-white text-xl font-bold tracking-wide">SHAA Apparels</p>
        </div>

        {/* Center tagline */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-10">
          <div className="text-center">
            <p className="text-white text-4xl font-bold italic leading-snug">
              "Crafting precision<br />into every stitch."
            </p>
            <div className="mt-8 flex justify-center gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-1 rounded-full bg-white"
                  style={{ width: i === 1 ? '32px' : '8px', opacity: i === 1 ? 1 : 0.4 }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom label */}
        <div className="relative z-10 px-10 pb-10">
          <p className="text-blue-200 text-sm">Garment Manufacturing ERP Platform</p>
        </div>
      </div>

      {/* Right panel — white form */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm">
          {/* Credential error banner */}
          {credentialError && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">
                Invalid credentials. Please check your Employee ID and password.
              </p>
            </div>
          )}

          {/* Header text */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            EMPLOYEE PORTAL
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome Back</h1>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@shaaapparel.com"
                className={[
                  'w-full px-3 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
                  errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
                ].join(' ')}
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={[
                    'w-full px-3 py-2.5 pr-10 rounded-lg border text-sm text-gray-900 placeholder-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
                    errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
                  ].join(' ')}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Sign in as (UI-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sign In as
              </label>
              <select
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-600">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1D4ED8' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
