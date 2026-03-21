import { useEffect, useState } from 'react';
import { Award, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useHackathonStore } from '@/store/hackathonStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { api } from '@/lib/api';

interface Cert {
  id: string; participantName: string; email: string; type: string; status: string;
  teamId: string; team: { name: string }; generatedAt?: string; sentAt?: string;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-4 h-4" style={{ color: 'var(--warning)' }} />,
  GENERATED: <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--blue)' }} />,
  SENT: <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />,
  FAILED: <XCircle className="w-4 h-4" style={{ color: 'var(--danger)' }} />,
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
    <div className="max-w-2xl mx-auto px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-heading">Certificates</h1>
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={generate} disabled={generating}>
            {generating ? <div className="spinner-white" style={{ width: 14, height: 14 }} /> : <Award className="w-3.5 h-3.5" />}
            Generate
          </button>
        )}
      </div>

      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Sent', value: stats.sent, color: 'var(--success)' },
            { label: 'Pending', value: stats.pending, color: 'var(--warning)' },
          ].map((s) => (
            <div key={s.label} className="metric-card text-center">
              <p className="font-bold" style={{ fontSize: 24, color: (s as any).color || 'var(--text)' }}>{s.value}</p>
              <p className="text-caption mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="card overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="skeleton w-4 h-4 rounded" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3.5 w-36 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : certs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Award className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /></div>
          <p className="font-medium" style={{ fontSize: 14 }}>No certificates yet</p>
          <p className="text-caption mt-1">Generate participation certificates for all teams</p>
          {isAdmin && (
            <button className="btn btn-primary btn-sm mt-4" onClick={generate} disabled={generating}>
              <Award className="w-3.5 h-3.5" /> Generate now
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {certs.slice(0, 100).map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
              {STATUS_ICON[c.status] || STATUS_ICON.PENDING}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" style={{ fontSize: 14 }}>{c.participantName}</p>
                <p className="text-caption truncate">{c.team?.name} · {c.email}</p>
              </div>
              <span className="badge flex-shrink-0" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>{c.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
