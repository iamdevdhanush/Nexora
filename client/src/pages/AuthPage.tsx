import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Zap, ChevronLeft, User } from 'lucide-react';
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
    setLoading(true); setError('');
    try {
      const res = await api.post<{ message: string; devOtp?: string }>('/api/auth/otp/request', { contact: contact.trim() });
      if (res.devOtp) setDevOtp(res.devOtp);
      setStep('otp');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return;
    setLoading(true); setError('');
    try {
      const res = await api.post<{ token: string; user: any }>('/api/auth/otp/verify', { contact: contact.trim(), code: otp });
      const generatedName = contact.includes('@') ? contact.split('@')[0] : 'User';
      if (res.user.name === generatedName || res.user.name === 'User') {
        setAuth(res.user, res.token);
        setStep('onboarding');
        return;
      }
      setAuth(res.user, res.token);
      const pending = sessionStorage.getItem('pendingInvite');
      if (pending) { sessionStorage.removeItem('pendingInvite'); navigate(`/join/${pending}`, { replace: true }); }
      else navigate('/', { replace: true });
    } catch { setError('Invalid code. Please try again.'); }
    finally { setLoading(false); }
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
      if (pending) { sessionStorage.removeItem('pendingInvite'); navigate(`/join/${pending}`, { replace: true }); }
      else navigate('/', { replace: true });
    } catch { navigate('/', { replace: true }); }
    finally { setLoading(false); }
  };

  const inputStyle = { height: 48, fontSize: 15, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' };
  const btnStyle = { height: 48, fontSize: 15, background: 'white', color: '#0A0A0A' };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 60% 0%, rgba(124,58,237,0.15) 0%, transparent 55%)' }} />
      <header className="relative z-10 flex items-center gap-2 px-6 py-5">
        <div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-white/70 font-medium text-sm tracking-tight">Nexora</span>
      </header>
      <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-12 max-w-sm mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-white font-bold tracking-tight mb-2" style={{ fontSize: 30, lineHeight: 1.15 }}>
            {step === 'contact' && <>Sign in to<br />your workspace</>}
            {step === 'otp' && <>Verify your<br />identity</>}
            {step === 'onboarding' && <>One last<br />thing</>}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            {step === 'contact' && 'Enter your email or phone to continue'}
            {step === 'otp' && `We sent a 6-digit code to ${contact}`}
            {step === 'onboarding' && 'What should we call you?'}
          </p>
        </div>
        <div className="space-y-3">
          {error && (
            <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(220,38,38,0.1)', color: '#FCA5A5', border: '1px solid rgba(220,38,38,0.2)' }}>
              {error}
            </div>
          )}
          {step === 'contact' && (
            <>
              <input type="text" inputMode="email" autoFocus value={contact} onChange={(e) => setContact(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && requestOtp()}
                placeholder="email or phone number"
                className="w-full px-4 rounded-lg text-white placeholder:text-white/25 outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.2)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
              <button onClick={requestOtp} disabled={loading || !contact.trim()}
                className="w-full flex items-center justify-center gap-2 font-semibold rounded-lg press"
                style={{ ...btnStyle, opacity: loading || !contact.trim() ? 0.5 : 1 }}>
                {loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
              </button>
            </>
          )}
          {step === 'otp' && (
            <>
              {devOtp && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer"
                  style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}
                  onClick={() => setOtp(devOtp)}>
                  <Shield className="w-4 h-4 flex-shrink-0" style={{ color: '#A78BFA' }} />
                  <div>
                    <p style={{ fontSize: 11, color: '#A78BFA', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Dev Mode</p>
                    <p className="font-mono font-bold text-white" style={{ fontSize: 18, letterSpacing: '0.15em' }}>{devOtp}</p>
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>tap to fill</span>
                </div>
              )}
              <input type="number" inputMode="numeric" autoFocus maxLength={6}
                value={otp} onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && otp.length === 6 && verifyOtp()}
                placeholder="000000"
                className="w-full text-center font-mono font-bold text-white placeholder:text-white/20 outline-none rounded-lg"
                style={{ ...inputStyle, height: 56, fontSize: 28, letterSpacing: '0.25em' }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.2)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
              <button onClick={verifyOtp} disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 font-semibold rounded-lg press"
                style={{ ...btnStyle, opacity: loading || otp.length !== 6 ? 0.5 : 1 }}>
                {loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <>Verify <ArrowRight className="w-4 h-4" /></>}
              </button>
              <button onClick={() => { setStep('contact'); setOtp(''); setError(''); }}
                className="w-full flex items-center justify-center gap-1.5"
                style={{ height: 40, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            </>
          )}
          {step === 'onboarding' && (
            <>
              <div className="flex items-center gap-3 px-4 py-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,58,237,0.2)' }}>
                  <User className="w-5 h-5" style={{ color: '#A78BFA' }} />
                </div>
                <div>
                  <p className="text-white font-semibold" style={{ fontSize: 14 }}>New account</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{contact}</p>
                </div>
              </div>
              <input type="text" autoFocus value={name} onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && completeOnboarding()}
                placeholder="Your full name"
                className="w-full px-4 rounded-lg text-white placeholder:text-white/25 outline-none"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.2)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
              <button onClick={completeOnboarding} disabled={loading || !name.trim()}
                className="w-full flex items-center justify-center gap-2 font-semibold rounded-lg press"
                style={{ ...btnStyle, opacity: loading || !name.trim() ? 0.5 : 1 }}>
                {loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <>Get started <ArrowRight className="w-4 h-4" /></>}
              </button>
            </>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 24, lineHeight: 1.6 }}>
          By continuing, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}
