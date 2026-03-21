import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AppShell } from '@/components/layout/AppShell';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TeamsPage } from '@/pages/TeamsPage';
import { CheckInPage } from '@/pages/CheckInPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { CertificatesPage } from '@/pages/CertificatesPage';
import { HackathonsPage } from '@/pages/HackathonsPage';
import { CoordinatorView } from '@/pages/CoordinatorView';

function Guard({ children }: { children: React.ReactNode }) {
  const auth = useAuthStore((s) => s.isAuthenticated);
  return auth ? <>{children}</> : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/coordinator"
          element={
            <Guard>
              <CoordinatorView />
            </Guard>
          }
        />
        <Route
          path="/"
          element={
            <Guard>
              <AppShell />
            </Guard>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="hackathons" element={<HackathonsPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="checkin" element={<CheckInPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
