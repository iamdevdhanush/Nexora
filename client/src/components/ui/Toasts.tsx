import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useUIStore, Toast } from '@/store/uiStore';
import { cn } from '@/lib/utils';

const CONFIGS: Record<Toast['variant'], { icon: React.ReactNode; bg: string; color: string }> = {
  success: { icon: <CheckCircle2 className="w-4 h-4" />, bg: '#0A0A0A', color: 'white' },
  error: { icon: <XCircle className="w-4 h-4" />, bg: 'var(--danger)', color: 'white' },
  warning: { icon: <AlertTriangle className="w-4 h-4" />, bg: 'var(--warning)', color: 'white' },
  info: { icon: <Info className="w-4 h-4" />, bg: 'var(--blue)', color: 'white' },
};

export function Toasts() {
  const { toasts, dismissToast } = useUIStore();
  return (
    <div className="fixed top-4 inset-x-4 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm mx-auto">
      {toasts.map((t) => {
        const { icon, bg, color } = CONFIGS[t.variant];
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 rounded-lg pointer-events-auto animate-slide-down"
            style={{
              background: bg,
              color,
              boxShadow: '0 8px 16px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {icon}
            <span className="flex-1 font-medium" style={{ fontSize: 13 }}>
              {t.message}
            </span>
            <button
              onClick={() => dismissToast(t.id)}
              className="opacity-60 hover:opacity-100 transition-opacity duration-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
