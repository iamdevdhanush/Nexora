import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

type Step = 'contact' | 'otp' | 'name';

export function AuthPage() {
  const [step, setStep] = useState<Step>('contact');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const requestOtp = async () => {
    if (!contact.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ message: string; devOtp?: string }>('/auth/otp/request', { contact: contact.trim() });
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
        ...(name && { name }),
      });
      setAuth(res.user, res.token);
      navigate('/', { replace: true });
    } catch (e: any) {
      if (e.message.includes('Invalid')) setError('Wrong code. Check and try again.');
      else setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      {/* Top decoration */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-8 pt-safe">
        {/* Logo area */}
        <div className="mb-12">
          <div className="w-14 h-14 bg-white/10 rounded-3xl flex items-center justify-center mb-6">
            <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-white text-[32px] font-bold leading-tight tracking-tight mb-2">
            {step === 'contact' && <>Welcome to<br />Nexora</>}
            {step === 'otp' && <>Enter your<br />code</>}
            {step === 'name' && <>What should<br />we call you?</>}
          </h1>
          <p className="text-white/50 text-[15px] leading-relaxed">
            {step === 'contact' && 'Sign in with your email or phone number'}
            {step === 'otp' && `Sent to ${contact}`}
            {step === 'name' && "This is how you'll appear to your team"}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          {error && (
            <div className="bg-danger-soft border border-danger/20 rounded-2xl px-4 py-3 text-sm text-danger">
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
                placeholder="email or +91 phone"
                className="w-full px-4 py-4 bg-white/10 border border-white/10 rounded-2xl text-white placeholder:text-white/30 text-[15px] focus:border-white/30 transition-colors"
              />
              <button
                onClick={requestOtp}
                disabled={loading || !contact.trim()}
                className="w-full flex items-center justify-center gap-2 py-4 bg-white text-ink font-semibold rounded-2xl text-[15px] disabled:opacity-40 press"
              >
                {loading ? <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              {devOtp && (
                <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-white/50 flex-shrink-0" />
                  <span className="text-white/50 text-xs">Dev OTP: </span>
                  <span className="text-white font-mono font-bold tracking-[0.2em]">{devOtp}</span>
                </div>
              )}
              {/* OTP digit input */}
              <input
                type="number"
                inputMode="numeric"
                autoFocus
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && otp.length === 6 && verifyOtp()}
                placeholder="000000"
                className="w-full px-4 py-4 bg-white/10 border border-white/10 rounded-2xl text-white placeholder:text-white/20 text-[24px] font-mono text-center tracking-[0.3em] focus:border-white/30 transition-colors"
              />
              <button
                onClick={verifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-4 bg-white text-ink font-semibold rounded-2xl text-[15px] disabled:opacity-40 press"
              >
                {loading ? <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" /> : <>Verify <ArrowRight className="w-4 h-4" /></>}
              </button>
              <button
                onClick={() => { setStep('contact'); setOtp(''); setError(''); }}
                className="w-full flex items-center justify-center gap-2 py-3 text-white/40 text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bottom safe area fill */}
      <div className="bg-ink" style={{ height: 'var(--safe-bottom)' }} />
    </div>
  );
}
