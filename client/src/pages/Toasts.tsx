import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useUIStore, Toast } from '@/store/uiStore';

const CONFIGS: Record<Toast['variant'], { icon: React.ReactNode; bg: string; border: string; color: string }> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    bg: 'var(--green-dim)',
    border: 'rgba(0,232,122,0.25)',
    color: 'var(--green)',
  },
  error: {
    icon: <XCircle className="w-4 h-4" />,
    bg: 'var(--red-dim)',
    border: 'rgba(248,113,113,0.25)',
    color: 'var(--red)',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    bg: 'var(--yellow-dim)',
    border: 'rgba(251,191,36,0.25)',
    color: 'var(--yellow)',
  },
  info: {
    icon: <Info className="w-4 h-4" />,
    bg: 'var(--blue-dim)',
    border: 'rgba(96,165,250,0.25)',
    color: 'var(--blue)',
  },
};

export function Toasts() {
  const { toasts, dismissToast } = useUIStore();
  return (
    <div className="fixed top-4 inset-x-4 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm mx-auto">
      {toasts.map((t) => {
        const config = CONFIGS[t.variant];
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl pointer-events-auto toast"
            style={{
              background: 'var(--bg-elevated)',
              border: `1px solid ${config.border}`,
              color: 'var(--text)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <span style={{ color: config.color, flexShrink: 0 }}>{config.icon}</span>
            <span className="flex-1 font-medium" style={{ fontSize: 13 }}>{t.message}</span>
            <button
              onClick={() => dismissToast(t.id)}
              className="opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
