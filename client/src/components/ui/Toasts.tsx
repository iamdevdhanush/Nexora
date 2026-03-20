import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useUIStore, Toast } from '@/store/uiStore';
import { cn } from '@/lib/utils';

const CONFIGS: Record<Toast['variant'], { icon: React.ReactNode; cls: string }> = {
  success: { icon: <CheckCircle2 className="w-4 h-4" />, cls: 'bg-success text-white' },
  error:   { icon: <XCircle className="w-4 h-4" />,     cls: 'bg-danger text-white' },
  warning: { icon: <AlertTriangle className="w-4 h-4" />, cls: 'bg-amber text-white' },
  info:    { icon: <Info className="w-4 h-4" />,          cls: 'bg-ink text-white' },
};

export function Toasts() {
  const { toasts, dismissToast } = useUIStore();
  return (
    <div className="fixed top-4 inset-x-4 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm mx-auto">
      {toasts.map((t) => {
        const { icon, cls } = CONFIGS[t.variant];
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-2xl shadow-elevated pointer-events-auto animate-slide-down',
              cls
            )}
          >
            {icon}
            <span className="flex-1 text-sm font-semibold">{t.message}</span>
            <button onClick={() => dismissToast(t.id)} className="opacity-60 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
