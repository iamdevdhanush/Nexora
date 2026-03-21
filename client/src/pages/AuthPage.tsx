import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Zap, ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

type Step = 'contact' | 'otp';

export function AuthPage() {
  const [step, setStep] = useState<Step>('contact');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
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
      setAuth(res.user, res.token);
      navigate('/', { replace: true });
    } catch (e: any) {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 60% 0%, rgba(124, 58, 237, 0.15) 0%, transparent 55%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-2 px-6 py-5">
        <div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-white/70 font-medium text-sm tracking-tight">Nexora</span>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-12 max-w-sm mx-auto w-full">
        {/* Headline */}
        <div className="mb-8">
          <h1 className="text-white font-bold tracking-tight mb-2" style={{ fontSize: 30, lineHeight: 1.15 }}>
            {step === 'contact' ? (
              <>Sign in to<br />your workspace</>
            ) : (
              <>Verify your<br />identity</>
            )}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            {step === 'contact'
              ? 'Enter your email or phone to continue'
              : `We sent a code to ${contact}`}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          {/* Error */}
          {error && (
            <div
              className="px-4 py-3 rounded-lg text-sm"
              style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#FCA5A5', border: '1px solid rgba(220,38,38,0.2)' }}
            >
              {error}
            </div>
          )}

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
                className="w-full px-4 rounded-lg text-white placeholder:text-white/25 outline-none transition-all duration-150"
                style={{
                  height: 48,
                  fontSize: 15,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.2)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
              <button
                onClick={requestOtp}
                disabled={loading || !contact.trim()}
                className="w-full flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 press"
                style={{
                  height: 48,
                  fontSize: 15,
                  background: 'white',
                  color: '#0A0A0A',
                  opacity: loading || !contact.trim() ? 0.5 : 1,
                }}
              >
                {loading ? (
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              {/* Dev banner */}
              {devOtp && (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer"
                  style={{ background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124,58,237,0.2)' }}
                  onClick={() => setOtp(devOtp)}
                >
                  <Shield className="w-4 h-4 flex-shrink-0" style={{ color: '#A78BFA' }} />
                  <div>
                    <p style={{ fontSize: 11, color: '#A78BFA', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Dev Mode</p>
                    <p className="font-mono font-bold text-white" style={{ fontSize: 18, letterSpacing: '0.15em' }}>
                      {devOtp}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>tap to fill</span>
                </div>
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
                className="w-full text-center font-mono font-bold text-white placeholder:text-white/20 outline-none rounded-lg transition-all duration-150"
                style={{
                  height: 56,
                  fontSize: 28,
                  letterSpacing: '0.25em',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.2)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />

              <button
                onClick={verifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 press"
                style={{
                  height: 48,
                  fontSize: 15,
                  background: 'white',
                  color: '#0A0A0A',
                  opacity: loading || otp.length !== 6 ? 0.5 : 1,
                }}
              >
                {loading ? (
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                ) : (
                  <>Verify <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <button
                onClick={() => { setStep('contact'); setOtp(''); setError(''); }}
                className="w-full flex items-center justify-center gap-1.5 transition-colors duration-150"
                style={{ height: 40, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            </>
          )}
        </div>

        {/* Footer note */}
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 24, lineHeight: 1.6 }}>
          By continuing, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}
