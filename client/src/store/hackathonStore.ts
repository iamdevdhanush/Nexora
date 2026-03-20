import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface Hackathon {
  id: string;
  name: string;
  description?: string;
  venue?: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'ENDED';
  maxTeams?: number;
  createdAt: string;
  _count?: { teams: number };
}

interface HackathonState {
  hackathons: Hackathon[];
  activeHackathon: Hackathon | null;
  loading: boolean;
  fetchHackathons: () => Promise<void>;
  setActiveHackathon: (h: Hackathon) => void;
  createHackathon: (data: Partial<Hackathon>) => Promise<Hackathon>;
  updateHackathon: (id: string, data: Partial<Hackathon>) => Promise<void>;
}

export const useHackathonStore = create<HackathonState>()(
  persist(
    (set, get) => ({
      hackathons: [],
      activeHackathon: null,
      loading: false,

      fetchHackathons: async () => {
        set({ loading: true });
        try {
          const hackathons = await api.get<Hackathon[]>('/hackathons');
          set({ hackathons, loading: false });
          // Auto-select first active hackathon if none selected
          if (!get().activeHackathon && hackathons.length > 0) {
            const active = hackathons.find((h) => h.status === 'ACTIVE') || hackathons[0];
            set({ activeHackathon: active });
          }
        } catch { set({ loading: false }); }
      },

      setActiveHackathon: (activeHackathon) => set({ activeHackathon }),

      createHackathon: async (data) => {
        const h = await api.post<Hackathon>('/hackathons', data);
        set((s) => ({ hackathons: [h, ...s.hackathons], activeHackathon: h }));
        return h;
      },

      updateHackathon: async (id, data) => {
        const h = await api.patch<Hackathon>(`/hackathons/${id}`, data);
        set((s) => ({
          hackathons: s.hackathons.map((x) => (x.id === id ? h : x)),
          activeHackathon: s.activeHackathon?.id === id ? h : s.activeHackathon,
        }));
      },
    }),
    { name: 'nexora-hackathon', partialize: (s) => ({ activeHackathon: s.activeHackathon }) }
  )
);
