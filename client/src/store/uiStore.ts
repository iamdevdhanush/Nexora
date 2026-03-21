import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info' | 'warning';
}

interface UIState {
  commandOpen: boolean;
  broadcastOpen: boolean;
  sheetsOpen: boolean;
  createHackathonOpen: boolean;
  createTeamOpen: boolean;
  inviteOpen: boolean;
  toasts: Toast[];
  setCommandOpen: (v: boolean) => void;
  setBroadcastOpen: (v: boolean) => void;
  setSheetsOpen: (v: boolean) => void;
  setCreateHackathonOpen: (v: boolean) => void;
  setCreateTeamOpen: (v: boolean) => void;
  setInviteOpen: (v: boolean) => void;
  toast: (message: string, variant?: Toast['variant']) => void;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  commandOpen: false,
  broadcastOpen: false,
  sheetsOpen: false,
  createHackathonOpen: false,
  createTeamOpen: false,
  inviteOpen: false,
  toasts: [],

  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setBroadcastOpen: (broadcastOpen) => set({ broadcastOpen }),
  setSheetsOpen: (sheetsOpen) => set({ sheetsOpen }),
  setCreateHackathonOpen: (createHackathonOpen) => set({ createHackathonOpen }),
  setCreateTeamOpen: (createTeamOpen) => set({ createTeamOpen }),
  setInviteOpen: (inviteOpen) => set({ inviteOpen }),

  toast: (message, variant = 'info') => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    setTimeout(() => get().dismissToast(id), 3500);
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
