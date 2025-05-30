import { useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Brain } from 'lucide-react';

export default function AuthPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [, setLocation] = useLocation();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (tab === 'signin') {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
          },
        });
        
        if (otpError) {
          setError(otpError.message);
        } else {
          setShowOtpForm(true);
        }
      } else {
        const { data: existingUser } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (existingUser?.user) {
          setError('User already exists. Please sign in instead.');
        } else {
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email,
            options: {
              data: {
                password,
              },
            },
          });
          
          if (otpError) {
            setError(otpError.message);
          } else {
            setShowOtpForm(true);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(false);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      if (error) {
        setResetError(error.message);
      } else {
        setResetSuccess(true);
      }
    } catch (err: any) {
      setResetError(err.message || 'Password reset failed');
    } finally {
      setResetLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError(null);
    try {
      const { error, data } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) {
        setOtpError(error.message);
      } else if (data.session) {
        if (tab === 'signup') {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.session.user.id,
                email: data.session.user.email,
                created_at: new Date().toISOString(),
              },
            ]);

          if (profileError) {
            setOtpError('Failed to create user profile. Please try again.');
            return;
          }
        }
        setLocation('/');
      }
    } catch (err: any) {
      setOtpError(err.message || 'OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: tab === 'signup',
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-2">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl font-bold mb-2">GroLead AI</CardTitle>
          <div className="flex justify-center gap-4 mt-2">
            <button
              className={`input-tab ${tab === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setTab('signin');
                setShowOtpForm(false);
              }}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`input-tab ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setTab('signup');
                setShowOtpForm(false);
              }}
              type="button"
            >
              Sign Up
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {!showOtpForm ? (
            <form className="space-y-4" onSubmit={handleAuth} autoComplete="on">
              <div>
                <label htmlFor="email" className="form-label block mb-1">Email</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="form-input w-full"
                  placeholder="you@email.com"
                  autoComplete="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
              <div>
                <label htmlFor="password" className="form-label block mb-1">Password</label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="form-input w-full"
                  placeholder="••••••••"
                  autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
              {error && <div className="text-red-600 text-sm text-center">{error}</div>}
              <Button
                type="submit"
                className="w-full mt-2"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending OTP...
                  </div>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpVerification} className="space-y-4" autoComplete="off">
              <div className="space-y-2">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-semibold text-slate-900">Enter Verification Code</h3>
                  <p className="text-sm text-slate-600">
                    We've sent a 6-digit code to <span className="font-medium text-blue-600">{email}</span>
                  </p>
                </div>
                <div className="relative">
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    value={otp}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                      setOtp(value);
                    }}
                    required
                    className="form-input w-full text-center text-2xl tracking-widest font-medium placeholder:text-slate-400"
                    placeholder="000000"
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <div className="h-5 w-5 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 text-center">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                    disabled={isResending}
                  >
                    {isResending ? 'Resending...' : 'Resend code'}
                  </button>
                </p>
              </div>
              {otpError && <div className="text-red-600 text-sm text-center">{otpError}</div>}
              <Button
                type="submit"
                className="w-full mt-2"
                disabled={otpLoading}
              >
                {otpLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify OTP'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowOtpForm(false)}
              >
                Back
              </Button>
            </form>
          )}
          
          {tab === 'signin' && !showOtpForm && (
            <div className="mt-4 text-center">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    Forgot Password?
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[360px] md:max-w-[400px] p-6 rounded-xl border border-slate-200 shadow-xl flex flex-col items-center">
                  <div className="flex flex-col items-center w-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg mb-3">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-slate-900 text-center">Reset Password</DialogTitle>
                    <p className="text-sm text-slate-600 max-w-xs mx-auto leading-normal text-center mb-4">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                  </div>
                  <form onSubmit={handleResetPassword} className="space-y-4 w-full max-w-xs mx-auto flex flex-col items-center" autoComplete="on">
                    <div className="space-y-1 w-full">
                      <label htmlFor="reset-email" className="text-sm font-medium text-slate-700 text-left w-full block">
                        Email Address
                      </label>
                      <Input
                        id="reset-email"
                        name="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        required
                        className="form-input w-full h-10 text-sm"
                        placeholder="you@email.com"
                        autoComplete="email"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck="false"
                      />
                    </div>
                    {resetError && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded-lg w-full">
                        <p className="text-sm text-red-600">{resetError}</p>
                      </div>
                    )}
                    {resetSuccess && (
                      <div className="p-2 bg-green-50 border border-green-200 rounded-lg w-full">
                        <p className="text-sm text-green-600">
                          Password reset link has been sent to your email. Please check your inbox.
                        </p>
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full h-10 bg-primary hover:bg-primary/90 text-base font-medium"
                      disabled={resetLoading}
                    >
                      {resetLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending Reset Link...
                        </div>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>
                    <div className="relative my-2 w-full">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-slate-500">or</span>
                      </div>
                    </div>
                    <p className="text-center text-sm text-slate-600 w-full">
                      Remember your password?{' '}
                      <button
                        type="button"
                        onClick={() => setShowOtpForm(false)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Sign in
                      </button>
                    </p>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 