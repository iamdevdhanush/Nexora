import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Zap, Users, MapPin, Calendar, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';

interface InviteInfo {
  hackathon: { id: string; name: string; description?: string; venue?: string; startDate: string; endDate: string; status: string; };
  createdBy: string; expiresAt: string; requiresApproval: boolean;
}

export function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.get<InviteInfo>(`/invites/${token}`).then(setInfo).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [token]);

  const handleJoin = async () => {
    if (!isAuthenticated) { sessionStorage.setItem('pendingInvite', token!); navigate('/auth'); return; }
    setJoining(true);
    try { await api.post(`/invites/${token}/accept`); setJoined(true); setTimeout(() => navigate('/'), 2000); }
    catch (e: any) { setError(e.message); }
    finally { setJoining(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><div className="spinner-white" style={{ width: 32, height: 32 }} /></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 60% 0%, rgba(124,58,237,0.15) 0%, transparent 55%)' }} />
      <header className="relative z-10 flex items-center gap-2 px-6 py-5">
        <div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} /></div>
        <span className="text-white/70 font-medium text-sm tracking-tight">Nexora</span>
      </header>
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-12 max-w-sm mx-auto w-full">
        {joined ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(22,163,74,0.15)' }}><CheckCircle2 className="w-8 h-8" style={{ color: '#22c55e' }} /></div>
            <h1 className="text-white font-bold text-2xl mb-2">You're in!</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Redirecting to your dashboard…</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(220,38,38,0.15)' }}><XCircle className="w-8 h-8" style={{ color: '#ef4444' }} /></div>
            <h1 className="text-white font-bold text-2xl mb-2">Invalid invite</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>{error}</p>
            <button onClick={() => navigate('/auth')} className="mt-6 btn" style={{ background: 'white', color: '#0A0A0A', height: 44, fontSize: 15 }}>Go to login</button>
          </div>
        ) : info ? (
          <>
            <div className="mb-8">
              <p className="mb-3" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>You've been invited by {info.createdBy}</p>
              <h1 className="text-white font-bold tracking-tight mb-2" style={{ fontSize: 28, lineHeight: 1.15 }}>Join as coordinator</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>Accept this invite to manage teams and help run the event.</p>
            </div>
            <div className="rounded-xl p-4 mb-6 space-y-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ fontSize: 16, background: 'rgba(255,255,255,0.1)' }}>{info.hackathon.name[0]}</div>
                <div><p className="text-white font-bold" style={{ fontSize: 16 }}>{info.hackathon.name}</p></div>
              </div>
              {info.hackathon.description && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{info.hackathon.description}</p>}
              <div className="space-y-1.5">
                {info.hackathon.venue && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} /><span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{info.hackathon.venue}</span></div>}
                <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} /><span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{formatDate(info.hackathon.startDate)} — {formatDate(info.hackathon.endDate)}</span></div>
              </div>
            </div>
            {!isAuthenticated && <div className="px-4 py-3 rounded-lg mb-4" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}><p style={{ fontSize: 13, color: 'rgba(167,139,250,0.9)' }}>You'll need to log in or create an account to accept this invite.</p></div>}
            <button onClick={handleJoin} disabled={joining} className="w-full flex items-center justify-center gap-2 font-semibold rounded-lg press" style={{ height: 48, fontSize: 15, background: 'white', color: '#0A0A0A', opacity: joining ? 0.7 : 1 }}>
              {joining ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <>{isAuthenticated ? 'Accept invite' : 'Log in & accept'} <ArrowRight className="w-4 h-4" /></>}
            </button>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 16, textAlign: 'center' }}>Invite expires {formatDate(info.expiresAt)}</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
