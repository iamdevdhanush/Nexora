import { useState } from 'react';
import { X, Link2, Copy, Check, MessageSquare, Calendar } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { api } from '@/lib/api';

interface InviteResult { token: string; url: string; expiresAt: string; message: string; }

export function InviteSheet() {
  const { setInviteOpen, toast } = useUIStore();
  const { activeHackathon } = useHackathonStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState<'url' | 'message' | null>(null);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [requireApproval, setRequireApproval] = useState(false);
  const close = () => setInviteOpen(false);

  const generate = async () => {
    if (!activeHackathon) return;
    setLoading(true);
    try {
      const data = await api.post<InviteResult>('/invites', { hackathonId: activeHackathon.id, expiresInDays, requireApproval });
      setResult(data); toast('Invite link generated!', 'success');
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const copy = async (type: 'url' | 'message') => {
    if (!result) return;
    await navigator.clipboard.writeText(type === 'url' ? result.url : result.message);
    setCopied(type); setTimeout(() => setCopied(null), 2000);
    toast(`${type === 'url' ? 'Link' : 'Message'} copied!`, 'success');
  };

  return (
    <>
      <div className="overlay animate-fade-in" onClick={close} />
      <div className="sheet animate-slide-up flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="sheet-handle" />
        <div className="flex items-center justify-between px-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-light)' }}><Link2 className="w-4 h-4" style={{ color: 'var(--accent)' }} /></div>
            <div><h2 className="font-bold" style={{ fontSize: 16 }}>Invite Coordinators</h2><p className="text-caption mt-0.5">Generate a secure invite link</p></div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={close}><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!result ? (
            <>
              <div className="invite-box p-4">
                <p className="font-semibold mb-1" style={{ fontSize: 14 }}>About invite links</p>
                <p className="text-caption">Anyone with this link can join <strong>{activeHackathon?.name}</strong> as a coordinator.</p>
              </div>
              <div>
                <p className="text-label mb-2">Link expires after</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 7, 14].map((d) => (
                    <button key={d} onClick={() => setExpiresInDays(d)} className="py-2 rounded-lg font-semibold transition-all duration-150"
                      style={{ fontSize: 13, background: expiresInDays === d ? '#0A0A0A' : 'var(--bg-muted)', color: expiresInDays === d ? 'white' : 'var(--text-secondary)' }}>{d}d</button>
                  ))}
                </div>
              </div>
              <label className="flex items-center justify-between p-4 rounded-lg cursor-pointer" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                <div><p className="font-medium" style={{ fontSize: 14 }}>Require approval</p><p className="text-caption mt-0.5">Approve each coordinator before they join</p></div>
                <input type="checkbox" checked={requireApproval} onChange={(e) => setRequireApproval(e.target.checked)} className="w-4 h-4 rounded" style={{ accentColor: '#0A0A0A' }} />
              </label>
            </>
          ) : (
            <>
              <div className="invite-box p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1"><Check className="w-4 h-4" style={{ color: 'var(--success)' }} /><p className="font-semibold" style={{ fontSize: 14, color: 'var(--success)' }}>Invite link ready</p></div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono truncate px-3 py-2 rounded-md" style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--text)' }}>{result.url}</code>
                  <button onClick={() => copy('url')} className="btn btn-secondary btn-sm flex-shrink-0">{copied === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied === 'url' ? 'Copied' : 'Copy'}</button>
                </div>
                <div className="flex items-center gap-1.5 text-caption"><Calendar className="w-3.5 h-3.5" />Expires {new Date(result.expiresAt).toLocaleDateString()}</div>
              </div>
              <div>
                <p className="text-label mb-2">Pre-written message</p>
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}><p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{result.message}</p></div>
                <button onClick={() => copy('message')} className="btn btn-secondary w-full mt-2">{copied === 'message' ? <Check className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}{copied === 'message' ? 'Copied message' : 'Copy message'}</button>
              </div>
              <button onClick={() => setResult(null)} className="btn btn-ghost w-full" style={{ color: 'var(--text-muted)' }}>Generate another link</button>
            </>
          )}
        </div>
        {!result && (
          <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--border)', paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
            <button onClick={generate} disabled={loading} className="btn btn-primary w-full" style={{ height: 42 }}>
              {loading ? <div className="spinner-white" style={{ width: 16, height: 16 }} /> : <Link2 className="w-4 h-4" />}
              {loading ? 'Generating…' : 'Generate invite link'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
