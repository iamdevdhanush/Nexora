import { useEffect, useState } from 'react';
import { Award, Send, RefreshCw, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useHackathonStore } from '@/store/hackathonStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { api } from '@/lib/api';
import { cn, formatDateTime } from '@/lib/utils';

interface Cert {
  id: string; participantName: string; email: string;
  type: string; status: string; teamId: string;
  team: { name: string }; generatedAt?: string; sentAt?: string;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-4 h-4 text-amber" />,
  GENERATED: <CheckCircle2 className="w-4 h-4 text-brand" />,
  SENT: <CheckCircle2 className="w-4 h-4 text-success" />,
  FAILED: <XCircle className="w-4 h-4 text-danger" />,
};

export function CertificatesPage() {
  const { activeHackathon } = useHackathonStore();
  const { user } = useAuthStore();
  const { toast } = useUIStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    if (!activeHackathon) return;
    setLoading(true);
    try { setCerts(await api.get<Cert[]>(`/hackathons/${activeHackathon.id}/certificates`)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [activeHackathon?.id]);

  const generate = async () => {
    if (!activeHackathon) return;
    setGenerating(true);
    try {
      const r = await api.post<{ created: number }>(`/hackathons/${activeHackathon.id}/certificates/generate`, { type: 'PARTICIPATION' });
      toast(`${r.created} certificates queued`, 'success');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setGenerating(false); }
  };

  const stats = {
    total: certs.length,
    sent: certs.filter((c) => c.status === 'SENT').length,
    pending: certs.filter((c) => c.status === 'PENDING').length,
  };

  return (
    <div className="px-4 pt-4 pb-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Certificates</h1>
        {isAdmin && (
          <button onClick={generate} disabled={generating} className="btn-primary py-2 px-4 text-sm">
            {generating ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Award className="w-3.5 h-3.5" />}
            Generate
          </button>
        )}
      </div>

      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[{ label: 'Total', value: stats.total }, { label: 'Sent', value: stats.sent }, { label: 'Pending', value: stats.pending }].map((s) => (
            <div key={s.label} className="card p-3 text-center">
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-ink-ghost">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton" />)}</div>
      ) : certs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-ink-ghost">
          <Award className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">No certificates yet</p>
          {isAdmin && <button onClick={generate} className="text-brand text-sm font-semibold mt-2">Generate now →</button>}
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-line/60">
          {certs.slice(0, 50).map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              {STATUS_ICON[c.status]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{c.participantName}</p>
                <p className="text-xs text-ink-ghost truncate">{c.team?.name} · {c.email}</p>
              </div>
              <span className="text-[10px] bg-line px-2 py-0.5 rounded-full text-ink-muted font-semibold">{c.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
