import React, { useState } from 'react';
import { X, Sparkles, Lock, Mail, User, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User as UserType } from '../types/analysis';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (user: UserType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client validation
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (mode === 'signup') {
      if (!fullName || fullName.trim().length < 2) {
        setError('Please enter your full name (at least 2 characters).');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const cleanEmail = email.trim().toLowerCase();
      const payload = mode === 'signup'
        ? { fullName: fullName.trim(), email: cleanEmail, password }
        : { email: cleanEmail, password };

      let serverHandled = false;

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json();
          serverHandled = true;

          if (res.ok && json.success && json.user) {
            try {
              localStorage.setItem('skillbridge_auth_user', JSON.stringify(json.user));
            } catch {}
            onSuccess(json.user);
            onClose();
            return;
          }

          if (json.error) {
            setError(json.error);
            return;
          }
        }
      } catch (networkErr) {
        // Server offline or network error
      }

      // Fallback for static environments (e.g. Vercel without separate Node/MySQL backend)
      let registeredUsers: any[] = [];
      try {
        registeredUsers = JSON.parse(localStorage.getItem('skillbridge_registered_users') || '[]');
      } catch {
        registeredUsers = [];
      }

      const existingUser = registeredUsers.find((u: any) => u.email.toLowerCase() === cleanEmail);

      if (mode === 'login') {
        if (!existingUser) {
          setError('User not found. No account is registered with this email address. Please sign up first.');
          return;
        }
        if (existingUser.password !== password) {
          setError('Incorrect password. Please try again.');
          return;
        }
        const userObj = {
          id: existingUser.id,
          fullName: existingUser.fullName,
          email: existingUser.email,
          createdAt: existingUser.createdAt,
        };
        try {
          localStorage.setItem('skillbridge_auth_user', JSON.stringify(userObj));
        } catch {}
        onSuccess(userObj);
        onClose();
        return;
      }

      if (mode === 'signup') {
        if (existingUser) {
          setError('An account with this email already exists. Please sign in instead.');
          return;
        }
        const newUser = {
          id: Date.now(),
          fullName: fullName.trim(),
          email: cleanEmail,
          password: password,
          createdAt: new Date().toISOString(),
        };
        registeredUsers.push(newUser);
        try {
          localStorage.setItem('skillbridge_registered_users', JSON.stringify(registeredUsers));
        } catch {}

        const userObj = {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          createdAt: newUser.createdAt,
        };
        try {
          localStorage.setItem('skillbridge_auth_user', JSON.stringify(userObj));
        } catch {}
        onSuccess(userObj);
        onClose();
        return;
      }

      setError('Authentication failed. Please try again.');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-[#FAF7F2] shadow-2xl border border-[#b7a89a]/50 z-10 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#b7a89a]/35 px-6 py-4 bg-[#e8dcc6]/35">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#722f37] text-[#FAF7F2] shadow-sm">
              <Sparkles className="h-4 w-4 text-[#e8dcc6]" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#231815]">
                {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
              </h2>
              <p className="text-xs text-[#574943]">
                {mode === 'login' ? 'Sign in to access your saved resume analyses' : 'Join SkillBridge AI to start optimizing your career'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#574943] hover:bg-[#e8dcc6]/50 hover:text-[#231815] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed space-y-1.5">
                <p>{error}</p>
                {mode === 'login' && error.includes('User not found') && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1 font-bold text-[#722f37] hover:underline cursor-pointer"
                  >
                    <span>Create an account now with this email</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#231815]">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#b7a89a]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Chen"
                  className="w-full rounded-xl border border-[#b7a89a]/50 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-[#231815] placeholder:text-[#b7a89a] focus:border-[#722f37] focus:outline-none focus:ring-2 focus:ring-[#722f37]/20"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#231815]">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#b7a89a]">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.chen@university.edu"
                className="w-full rounded-xl border border-[#b7a89a]/50 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-[#231815] placeholder:text-[#b7a89a] focus:border-[#722f37] focus:outline-none focus:ring-2 focus:ring-[#722f37]/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#231815]">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#b7a89a]">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#b7a89a]/50 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-[#231815] placeholder:text-[#b7a89a] focus:border-[#722f37] focus:outline-none focus:ring-2 focus:ring-[#722f37]/20"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#231815]">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#b7a89a]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#b7a89a]/50 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-[#231815] placeholder:text-[#b7a89a] focus:border-[#722f37] focus:outline-none focus:ring-2 focus:ring-[#722f37]/20"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#722f37] hover:bg-[#551b22] py-3 text-sm font-bold text-[#FAF7F2] shadow-md shadow-[#722f37]/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#e8dcc6]" />
                  <span>{mode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="h-4 w-4 text-[#e8dcc6]" />
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-2 border-t border-[#b7a89a]/35">
            {mode === 'login' ? (
              <p className="text-xs text-[#574943]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-bold text-[#722f37] hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-xs text-[#574943]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-[#722f37] hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
