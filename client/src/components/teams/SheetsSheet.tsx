import { useState } from 'react';
import { X, Table2, CheckCircle2 } from 'lucide-react';
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
  const [result, setResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
  } | null>(null);
  const close = () => setSheetsOpen(false);

  const sync = async () => {
    if (!activeHackathon || !sheetId.trim()) return;
    setLoading(true);
    try {
      const r = await api.post<typeof result>(
        `/hackathons/${activeHackathon.id}/sheets/sync`,
        { sheetId: sheetId.trim(), range }
      );
      setResult(r);
      await fetchTeams(activeHackathon.id);
      toast(`Synced: ${r!.created} created, ${r!.updated} updated`, 'success');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="overlay animate-fade-in" onClick={close} />
      <div className="sheet animate-slide-up">
        <div className="sheet-handle" />

        <div
          className="flex items-center justify-between px-5 pb-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--green-dim)', border: '1px solid rgba(0,232,122,0.2)' }}
            >
              <Table2 className="w-4 h-4" style={{ color: 'var(--green)' }} />
            </div>
            <div>
              <h2 className="font-display font-bold" style={{ fontSize: 17, letterSpacing: '-0.02em' }}>
                Sync Google Sheets
              </h2>
              <p className="text-caption mt-0.5">Import teams from registration form</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={close}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className="px-5 py-4 space-y-4"
          style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}
        >
          <div
            className="px-4 py-3 rounded-xl"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <p className="font-semibold mb-1" style={{ fontSize: 13 }}>
              Find your Sheet ID in the URL:
            </p>
            <p
              className="font-mono"
              style={{ fontSize: 11, color: 'var(--text-muted)', wordBreak: 'break-all' }}
            >
              docs.google.com/spreadsheets/d/
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>
                SHEET_ID
              </span>
              /edit
            </p>
          </div>

          <input
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
            placeholder="Sheet ID"
            className="input font-mono"
          />
          <input
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder="Range"
            className="input font-mono"
          />

          {result && (
            <div
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
              style={{
                background: 'var(--green-dim)',
                border: '1px solid rgba(0,232,122,0.2)',
              }}
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--green)' }} />
              <p className="font-semibold" style={{ fontSize: 14, color: 'var(--green)' }}>
                {result.created} created · {result.updated} updated ·{' '}
                {result.skipped} skipped
              </p>
            </div>
          )}

          <button
            onClick={sync}
            disabled={loading || !sheetId.trim()}
            className="btn btn-green w-full"
            style={{ height: 48, fontSize: 15 }}
          >
            {loading ? (
              <div className="spinner-white" style={{ width: 16, height: 16 }} />
            ) : (
              <Table2 className="w-4 h-4" />
            )}
            {loading ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
      </div>
    </>
  );
}
