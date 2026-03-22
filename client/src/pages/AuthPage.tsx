import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, Zap, Shield, User } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

type Step = 'contact' | 'otp' | 'onboarding';

export function AuthPage() {
  const [step, setStep] = useState<Step>('contact');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const requestOtp = async () => {
    if (!contact.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ message: string; devOtp?: string }>('/auth/otp/request', {
        contact: contact.trim(),
      });
      if (res.devOtp) setDevOtp(res.devOtp);
      setStep('otp');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ token: string; user: any }>('/auth/otp/verify', {
        contact: contact.trim(),
        code: otp,
      });
      const isNewUser =
        res.user.name === contact.split('@')[0] ||
        res.user.name === 'User' ||
        !res.user.name;

      if (isNewUser) {
        setAuth(res.user, res.token);
        setStep('onboarding');
        return;
      }
      setAuth(res.user, res.token);
      const pending = sessionStorage.getItem('pendingInvite');
      if (pending) {
        sessionStorage.removeItem('pendingInvite');
        navigate(`/join/${pending}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch {
      setError('Invalid code. Please try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.patch('/auth/me', { name: name.trim() });
      const user = await api.get<any>('/auth/me');
      const token = useAuthStore.getState().token!;
      setAuth(user, token);
      const pending = sessionStorage.getItem('pendingInvite');
      if (pending) {
        sessionStorage.removeItem('pendingInvite');
        navigate(`/join/${pending}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch {
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const headings: Record<Step, { title: string; sub: string }> = {
    contact: { title: 'Welcome back', sub: 'Enter your email or phone to continue' },
    otp: { title: 'Check your inbox', sub: `We sent a 6-digit code to ${contact}` },
    onboarding: { title: 'Almost there', sub: 'What should we call you?' },
  };

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: '#060606' }}
    >
      {/* Background effects */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% -10%, rgba(167,139,250,0.12) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: 300,
          background:
            'radial-gradient(ellipse 80% 60% at 50% 120%, rgba(0,232,122,0.05) 0%, transparent 70%)',
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-2.5 px-6 py-5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span
          className="font-display font-bold text-white tracking-tight"
          style={{ fontSize: 15 }}
        >
          Nexora
        </span>
        <span
          className="ml-auto text-xs font-mono px-2 py-0.5 rounded"
          style={{
            background: 'rgba(0,232,122,0.1)',
            color: '#00E87A',
            border: '1px solid rgba(0,232,122,0.2)',
          }}
        >
          BETA
        </span>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-12 max-w-sm mx-auto w-full">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {(['contact', 'otp', 'onboarding'] as Step[]).map((s, i) => (
            <div
              key={s}
              className="flex-1 h-0.5 rounded-full transition-all duration-400"
              style={{
                background:
                  s === step
                    ? 'var(--purple)'
                    : ['contact', 'otp', 'onboarding'].indexOf(s) <
                      ['contact', 'otp', 'onboarding'].indexOf(step)
                    ? 'rgba(167,139,250,0.6)'
                    : 'rgba(255,255,255,0.08)',
              }}
            />
          ))}
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1
            className="font-display font-bold text-white mb-2"
            style={{ fontSize: 32, lineHeight: 1.15, letterSpacing: '-0.025em' }}
          >
            {headings[step].title}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
            {headings[step].sub}
          </p>
        </div>

        {/* Forms */}
        <div className="space-y-3">
          {/* Error */}
          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm animate-fade-in"
              style={{
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
                color: '#FCA5A5',
              }}
            >
              {error}
            </div>
          )}

          {/* Contact Step */}
          {step === 'contact' && (
            <>
              <input
                type="text"
                inputMode="email"
                autoFocus
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && requestOtp()}
                placeholder="email or phone number"
                className="input-dark"
              />
              <button
                onClick={requestOtp}
                disabled={loading || !contact.trim()}
                className="btn-dark-primary w-full"
                style={{
                  height: 52,
                  background: loading || !contact.trim() ? 'rgba(255,255,255,0.06)' : 'white',
                  color: loading || !contact.trim() ? 'rgba(255,255,255,0.3)' : '#000',
                  borderRadius: 'var(--r-md)',
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading || !contact.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {loading ? (
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                ) : (
                  <>
                    Continue <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <>
              {devOtp && (
                <button
                  onClick={() => setOtp(devOtp)}
                  className="dev-badge w-full text-left animate-fade-in press"
                  style={{ display: 'block' }}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--purple)' }} />
                    <div className="flex-1">
                      <p
                        style={{
                          fontSize: 10,
                          color: 'var(--purple)',
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Dev Mode — tap to fill
                      </p>
                      <p
                        className="font-mono font-bold text-white"
                        style={{ fontSize: 22, letterSpacing: '0.2em', marginTop: 2 }}
                      >
                        {devOtp}
                      </p>
                    </div>
                  </div>
                </button>
              )}

              <input
                type="number"
                inputMode="numeric"
                autoFocus
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && otp.length === 6 && verifyOtp()}
                placeholder="000000"
                className="otp-input"
              />

              <button
                onClick={verifyOtp}
                disabled={loading || otp.length !== 6}
                style={{
                  width: '100%',
                  height: 52,
                  background:
                    loading || otp.length !== 6
                      ? 'rgba(0,232,122,0.15)'
                      : 'var(--green)',
                  color: loading || otp.length !== 6 ? 'rgba(0,232,122,0.5)' : '#000',
                  borderRadius: 'var(--r-md)',
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  fontFamily: 'Syne, sans-serif',
                  letterSpacing: '0.01em',
                }}
              >
                {loading ? (
                  <div className="spinner-green" style={{ width: 18, height: 18 }} />
                ) : (
                  <>
                    Verify Code <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                onClick={() => { setStep('contact'); setOtp(''); setError(''); }}
                style={{
                  width: '100%',
                  height: 44,
                  background: 'transparent',
                  border: 'none',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            </>
          )}

          {/* Onboarding Step */}
          {step === 'onboarding' && (
            <>
              <div
                className="flex items-center gap-3 p-4 rounded-xl animate-fade-in"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--purple-dim)', border: '1px solid rgba(167,139,250,0.2)' }}
                >
                  <User className="w-5 h-5" style={{ color: 'var(--purple)' }} />
                </div>
                <div>
                  <p className="text-white font-medium" style={{ fontSize: 14 }}>
                    New account
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                    {contact}
                  </p>
                </div>
              </div>

              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && completeOnboarding()}
                placeholder="Your full name"
                className="input-dark"
              />

              <button
                onClick={completeOnboarding}
                disabled={loading || !name.trim()}
                style={{
                  width: '100%',
                  height: 52,
                  background: loading || !name.trim() ? 'rgba(255,255,255,0.06)' : 'white',
                  color: loading || !name.trim() ? 'rgba(255,255,255,0.3)' : '#000',
                  borderRadius: 'var(--r-md)',
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {loading ? (
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                ) : (
                  <>
                    Get started <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}
        </div>

        <p
          className="mt-8 text-center"
          style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.18)', lineHeight: 1.7 }}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
