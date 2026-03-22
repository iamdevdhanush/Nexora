import { useState } from 'react';
import { X, Link2, Copy, Check, MessageSquare, Calendar, Shield } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { api } from '@/lib/api';

interface InviteResult {
  token: string;
  url: string;
  expiresAt: string;
  message: string;
}

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
      const data = await api.post<InviteResult>('/invites', {
        hackathonId: activeHackathon.id,
        expiresInDays,
        requireApproval,
      });
      setResult(data);
      toast('Invite link generated!', 'success');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copy = async (type: 'url' | 'message') => {
    if (!result) return;
    await navigator.clipboard.writeText(
      type === 'url' ? result.url : result.message
    );
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast(`${type === 'url' ? 'Link' : 'Message'} copied!`, 'success');
  };

  return (
    <>
      <div className="overlay animate-fade-in" onClick={close} />
      <div className="sheet animate-slide-up flex flex-col" style={{ maxHeight: '88vh' }}>
        <div className="sheet-handle" />

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pb-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--purple-dim)', border: '1px solid rgba(167,139,250,0.2)' }}
            >
              <Link2 className="w-4 h-4" style={{ color: 'var(--purple)' }} />
            </div>
            <div>
              <h2 className="font-display font-bold" style={{ fontSize: 17, letterSpacing: '-0.02em' }}>
                Invite Coordinators
              </h2>
              <p className="text-caption mt-0.5">Generate a secure invite link</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={close}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!result ? (
            <>
              {/* Info box */}
              <div className="invite-highlight p-4">
                <div className="flex items-start gap-2.5">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--purple)' }} />
                  <div>
                    <p className="font-semibold mb-1" style={{ fontSize: 13.5 }}>About invite links</p>
                    <p className="text-caption">
                      Anyone with this link can join{' '}
                      <strong style={{ color: 'var(--text-secondary)' }}>
                        {activeHackathon?.name}
                      </strong>{' '}
                      as a coordinator.
                    </p>
                  </div>
                </div>
              </div>

              {/* Expiry */}
              <div>
                <p className="text-label mb-3">Link expires after</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 7, 14].map((d) => (
                    <button
                      key={d}
                      onClick={() => setExpiresInDays(d)}
                      className="py-2.5 rounded-xl font-semibold transition-all duration-150"
                      style={{
                        fontSize: 13,
                        background:
                          expiresInDays === d
                            ? 'var(--purple)'
                            : 'var(--bg-elevated)',
                        color:
                          expiresInDays === d
                            ? 'white'
                            : 'var(--text-secondary)',
                        border:
                          expiresInDays === d
                            ? '1px solid transparent'
                            : '1px solid var(--border-strong)',
                      }}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Approval toggle */}
              <label
                className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <p className="font-medium" style={{ fontSize: 14 }}>
                    Require approval
                  </p>
                  <p className="text-caption mt-0.5">
                    Manually approve each new coordinator
                  </p>
                </div>
                <div
                  className="relative w-10 h-5.5 rounded-full transition-colors duration-200"
                  style={{
                    width: 40,
                    height: 22,
                    background: requireApproval
                      ? 'var(--purple)'
                      : 'var(--bg-elevated)',
                    border: '1px solid var(--border-strong)',
                  }}
                  onClick={() => setRequireApproval(!requireApproval)}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200"
                    style={{
                      width: 16,
                      height: 16,
                      top: 2,
                      left: requireApproval ? 20 : 2,
                      background: 'white',
                    }}
                  />
                </div>
                <input
                  type="checkbox"
                  checked={requireApproval}
                  onChange={(e) => setRequireApproval(e.target.checked)}
                  className="sr-only"
                />
              </label>
            </>
          ) : (
            <>
              {/* Success state */}
              <div
                className="p-4 rounded-xl space-y-3"
                style={{
                  background: 'var(--green-dim)',
                  border: '1px solid rgba(0,232,122,0.2)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" style={{ color: 'var(--green)' }} />
                  <p className="font-semibold" style={{ fontSize: 14, color: 'var(--green)' }}>
                    Invite link ready
                  </p>
                </div>

                {/* URL row */}
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 text-xs font-mono truncate px-3 py-2.5 rounded-xl"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 11 }}
                  >
                    {result.url}
                  </code>
                  <button
                    onClick={() => copy('url')}
                    className="btn btn-secondary btn-sm flex-shrink-0 gap-1.5"
                  >
                    {copied === 'url' ? (
                      <Check className="w-3.5 h-3.5" style={{ color: 'var(--green)' }} />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied === 'url' ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {/* Expiry */}
                <div className="flex items-center gap-1.5 text-caption">
                  <Calendar className="w-3.5 h-3.5" />
                  Expires {new Date(result.expiresAt).toLocaleDateString()}
                </div>
              </div>

              {/* Message copy */}
              <div>
                <p className="text-label mb-3">Pre-written message</p>
                <div
                  className="p-4 rounded-xl mb-3"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <p
                    style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}
                  >
                    {result.message}
                  </p>
                </div>
                <button
                  onClick={() => copy('message')}
                  className="btn btn-secondary w-full"
                >
                  {copied === 'message' ? (
                    <Check className="w-3.5 h-3.5" style={{ color: 'var(--green)' }} />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5" />
                  )}
                  {copied === 'message' ? 'Copied!' : 'Copy message'}
                </button>
              </div>

              <button
                onClick={() => setResult(null)}
                className="btn btn-ghost w-full"
                style={{ color: 'var(--text-muted)' }}
              >
                Generate another link
              </button>
            </>
          )}
        </div>

        {/* Generate button */}
        {!result && (
          <div
            className="px-5 py-4 border-t"
            style={{
              borderColor: 'var(--border)',
              paddingBottom: 'calc(16px + var(--safe-bottom))',
            }}
          >
            <button
              onClick={generate}
              disabled={loading}
              className="btn w-full"
              style={{
                height: 48,
                background: 'var(--purple)',
                color: 'white',
                fontSize: 15,
                fontWeight: 600,
                borderRadius: 'var(--r-md)',
              }}
            >
              {loading ? (
                <div className="spinner-white" style={{ width: 16, height: 16 }} />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              {loading ? 'Generating…' : 'Generate invite link'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
