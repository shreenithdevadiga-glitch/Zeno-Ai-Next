import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, Lock, Mail, Phone, ArrowLeft, ArrowRight, 
  AlertCircle, CheckCircle2, RefreshCw, KeyRound, ShieldAlert 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch, setStoredToken } from '../../lib/api';

type AuthMode = 'login' | 'forgot' | 'reset';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Forgot Password / OTP Request State
  const [identifier, setIdentifier] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [cooldown, setCooldown] = useState(0);

  // OTP Verification & Reset State
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);

  // UI / Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cooldown countdown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle Admin Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await apiFetch('/api/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password })
      });

      if (res.token) {
        setStoredToken(res.token);
        await refreshUser();
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Administrator authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Requesting OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await apiFetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ identifier: identifier.trim(), channel })
      });

      setSuccessMessage(res.message || 'If the account exists, a verification code has been dispatched.');
      setCooldown(res.resendCooldown || 60);
      setMode('reset');
    } catch (err: any) {
      setError(err.message || 'Failed to request recovery code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verification & Password Reset
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // 1. If reset token not yet issued, verify OTP first
      let activeResetToken = resetToken;
      if (!activeResetToken) {
        const verifyRes = await apiFetch('/api/admin/auth/verify-otp', {
          method: 'POST',
          body: JSON.stringify({ identifier: identifier.trim(), otp: otp.trim() })
        });
        activeResetToken = verifyRes.resetToken;
        setResetToken(activeResetToken);
      }

      // 2. Submit new password
      const resetRes = await apiFetch('/api/admin/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          resetToken: activeResetToken,
          newPassword,
          confirmPassword
        })
      });

      setSuccessMessage(resetRes.message || 'Password successfully updated. All active sessions invalidated.');
      setMode('login');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
      setResetToken(null);
    } catch (err: any) {
      setError(err.message || 'Failed to complete password reset.');
    } finally {
      setLoading(false);
    }
  };

  // Real-time password validation indicators
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isPasswordStrong = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#050608] relative overflow-hidden text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* Background Ambient Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-600/10 via-indigo-600/10 to-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-lg rounded-3xl bg-[#090b10]/95 backdrop-blur-2xl p-8 md:p-10 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-6">
        
        {/* Brand & Security Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 mb-2 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 tracking-wider uppercase">
              Admin Gateway
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {mode === 'login' && 'Administrator Sign In'}
            {mode === 'forgot' && 'Account Recovery'}
            {mode === 'reset' && 'Set New Password'}
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {mode === 'login' && 'Restricted portal for authorized platform operators. Granular RBAC and session audit logs are strictly enforced.'}
            {mode === 'forgot' && 'Prove channel control via cryptographically generated OTP delivered to your verified recovery channel.'}
            {mode === 'reset' && 'Enter the 6-digit single-use verification code sent to your delivery channel and define a strong new password.'}
          </p>
        </div>

        {/* Global Feedback Banners */}
        {error && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 1: ADMIN LOGIN FORM                                       */}
        {/* ============================================================== */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Administrator Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="shreenithdevadiga@gmail.com"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                    setSuccessMessage(null);
                    setIdentifier(email || 'shreenithdevadiga@gmail.com');
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              {/* Zero Plaintext Password Leak Rule: password input without Show Password */}
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all tracking-wider"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <span>Sign In as Administrator</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* MODE 2: FORGOT PASSWORD / REQUEST REAL OTP                     */}
        {/* ============================================================== */}
        {mode === 'forgot' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Delivery Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    channel === 'email'
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                      : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Primary Email
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    channel === 'sms'
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                      : 'bg-black/30 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  Recovery SMS
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                {channel === 'email' ? <Mail className="w-3.5 h-3.5 text-slate-400" /> : <Phone className="w-3.5 h-3.5 text-slate-400" />}
                {channel === 'email' ? 'Registered Administrator Email' : 'Verified Recovery Phone Number'}
              </label>
              <input
                type={channel === 'email' ? 'email' : 'tel'}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={channel === 'email' ? 'shreenithdevadiga@gmail.com' : '+1 (555) 000-0000'}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !identifier.trim() || cooldown > 0}
              className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Dispatching Code...
                </>
              ) : cooldown > 0 ? (
                `Resend available in ${cooldown}s`
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <KeyRound className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className="w-full py-2 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Administrator Login
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* MODE 3: VERIFY REAL OTP & RESET PASSWORD                       */}
        {/* ============================================================== */}
        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  6-Digit Verification Code (OTP)
                </label>
                {cooldown > 0 ? (
                  <span className="text-[11px] text-slate-400">Resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-4 py-2.5 text-center tracking-[0.4em] font-mono text-xl rounded-xl bg-black/40 border border-cyan-500/30 text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                New Strong Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all tracking-wider"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all tracking-wider"
              />
            </div>

            {/* Password Policy Progress Badges */}
            <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Password Policy Requirements
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  8+ Characters
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${hasUpper ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  Uppercase letter (A-Z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${hasLower ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  Lowercase letter (a-z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  Number (0-9)
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${hasSpecial ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  Special symbol (!@#$)
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6 || !isPasswordStrong || newPassword !== confirmPassword}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying & Updating...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Update Password & Revoke Sessions</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className="w-full py-2 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Cancel & Return to Login
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
          <Link to="/app/chat" className="hover:text-slate-300 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            User Workspace
          </Link>
          <span className="font-mono text-[11px] text-slate-600">ZENO SEC-AUTH 2.0</span>
        </div>

      </div>
    </div>
  );
};
