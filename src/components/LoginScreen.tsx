import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      const errorCode = err?.code || '';
      if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
        setError(null);
      } else if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (errorCode === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (errorCode === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError('Authentication failed. Please verify your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const errorCode = err?.code || '';
      if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
        setError(null);
      } else {
        setError('Google sign in could not be completed. Please try again or use email.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#324C3D] text-[#E8F3EB] mb-4 shadow-sm border border-[#24382C]">
          <span className="text-2xl">🌱</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#1E2922] tracking-wide">
          EMORA
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#6C7B71] max-w-sm mx-auto">
          A personal, botanical reflection space guarded by private per-user isolation.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xs border border-[#ECE6DC] rounded-3xl sm:px-10">
          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl">
              {error}
            </div>
          )}

          {/* Google Sign-in */}
          <button
            id="google-signin-button"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-stone-300 bg-white text-stone-800 font-medium hover:bg-stone-50 active:bg-stone-100 transition-colors disabled:opacity-50 shadow-xs"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-stone-400 font-medium">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  id="signup-name-input"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 text-sm"
                  placeholder="Your Name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                id="password-input"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E5DFD5] bg-[#F6F3EE] text-[#1E2922] placeholder-[#8A988D] focus:outline-none focus:ring-2 focus:ring-[#324C3D]/20 focus:border-[#324C3D] text-xs"
                placeholder="••••••••"
              />
            </div>

            <button
              id="submit-auth-button"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-2xl bg-[#324C3D] text-white font-medium hover:bg-[#23372B] active:bg-[#16251D] transition-colors disabled:opacity-50 text-xs flex items-center justify-center gap-2 shadow-xs"
            >
              {loading ? (
                'Processing...'
              ) : isSignUp ? (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              id="toggle-auth-mode-button"
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-stone-600 hover:text-stone-900 font-medium"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Create one"}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-center gap-2 text-xs text-stone-500">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>End-to-End Per-User Security Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
