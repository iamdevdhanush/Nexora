import { useState } from 'react';
import { X, Table2, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { useTeamsStore } from '@/store/teamsStore';
import { api } from '@/lib/api';

export function SheetsSheet() {
  const { setSheetsOpen, toast } = useUIStore();
  const { activeHackathon } = useHackathonStore();
  const { fetchTeams } = useTeamsStore();
  const [sheetId, setSheetId] = useState('');
  const [range, setRange] = useState('Sheet1!A:Z');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number } | null>(null);

  const sync = async () => {
    if (!activeHackathon || !sheetId.trim()) return;
    setLoading(true);
    try {
      const r = await api.post<typeof result>(`/hackathons/${activeHackathon.id}/sheets/sync`, { sheetId: sheetId.trim(), range });
      setResult(r);
      await fetchTeams(activeHackathon.id);
      toast(`Synced: ${r!.created} created, ${r!.updated} updated`, 'success');
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={() => setSheetsOpen(false)} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-3xl shadow-modal animate-slide-up">
        <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 bg-line rounded-full" /></div>
        <div className="flex items-center justify-between px-5 pb-4">
          <div>
            <h2 className="font-bold text-base">Sync Google Sheets</h2>
            <p className="text-xs text-ink-ghost">Import teams from registration form</p>
          </div>
          <button onClick={() => setSheetsOpen(false)} className="w-8 h-8 rounded-full bg-line/60 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-safe space-y-4">
          <div className="bg-line/40 rounded-2xl p-4 text-xs text-ink-muted space-y-1.5">
            <p className="font-semibold text-ink">Find your Sheet ID in the URL:</p>
            <p className="font-mono text-[11px] bg-surface px-2 py-1.5 rounded-xl break-all">
              docs.google.com/spreadsheets/d/<span className="text-brand font-bold">SHEET_ID</span>/edit
            </p>
          </div>

          <input value={sheetId} onChange={(e) => setSheetId(e.target.value)} placeholder="Sheet ID" className="input font-mono" />
          <input value={range} onChange={(e) => setRange(e.target.value)} placeholder="Range" className="input font-mono text-sm" />

          {result && (
            <div className="flex items-center gap-3 bg-success-soft rounded-2xl px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              <p className="text-sm font-semibold text-success">
                {result.created} created · {result.updated} updated · {result.skipped} skipped
              </p>
            </div>
          )}

          <button onClick={sync} disabled={loading || !sheetId.trim()} className="w-full btn-primary py-3.5 text-[15px]">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Table2 className="w-5 h-5" />}
            {loading ? 'Syncing…' : 'Sync Now'}
          </button>
          <div className="h-2" />
        </div>
      </div>
    </>
  );
}
