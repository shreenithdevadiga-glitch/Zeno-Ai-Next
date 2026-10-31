import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useOutletContext, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RGBThemeProvider } from './context/RGBThemeContext';
import { AppLayout } from './components/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ChatPage } from './pages/ChatPage';
import { ResearchPage } from './pages/ResearchPage';
import { FilesPage } from './pages/FilesPage';
import { ImagesPage } from './pages/ImagesPage';
import { VoicePage } from './pages/VoicePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { MemoryPage } from './pages/MemoryPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { SharePage } from './pages/SharePage';
import { ZenoOrb } from './components/ZenoOrb';

// Admin Console Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAuthAuditsPage } from './pages/admin/AdminAuthAuditsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminAiAnalyticsPage } from './pages/admin/AdminAiAnalyticsPage';
import { AdminProvidersModelsPage } from './pages/admin/AdminProvidersModelsPage';
import { AdminContentPage } from './pages/admin/AdminContentPage';
import { AdminSecurityPage } from './pages/admin/AdminSecurityPage';
import { AdminOpsPage } from './pages/admin/AdminOpsPage';
import { AdminSaaSSystemPage } from './pages/admin/AdminSaaSSystemPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { ShieldAlert } from 'lucide-react';

// Protected Route wrapper that ensures authentication
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080b] flex items-center justify-center">
        <ZenoOrb size="md" state="thinking" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const ADMIN_ROLES = ['super-admin', 'admin'];

const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06070a] flex items-center justify-center">
        <ZenoOrb size="md" state="thinking" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!user.role || !ADMIN_ROLES.includes(user.role)) {
    return (
      <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white">Administrator Access Denied</h1>
        <p className="text-sm text-slate-400 max-w-md">Your account does not possess the requisite administrative role to view the ZENO SaaS Admin Console.</p>
        <Link to="/app/chat" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors">
          Return to Workspace
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};

// ChatPage Outlet connector
const ChatPageWrapper: React.FC = () => {
  const { onToggleMobileSidebar } = useOutletContext<{ onToggleMobileSidebar: () => void }>();
  return <ChatPage onToggleMobileSidebar={onToggleMobileSidebar} />;
};

export default function App() {
  return (
    <RGBThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />

            {/* Authenticated Workspace */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/chat" replace />} />
              <Route path="chat" element={<ChatPageWrapper />} />
              <Route path="chat/:id" element={<ChatPageWrapper />} />
              <Route path="research" element={<ResearchPage />} />
              <Route path="files" element={<FilesPage />} />
              <Route path="images" element={<ImagesPage />} />
              <Route path="voice" element={<VoicePage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="memory" element={<MemoryPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Enterprise SaaS Admin Console */}
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="auth-audits" element={<AdminAuthAuditsPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="ai-analytics" element={<AdminAiAnalyticsPage />} />
              <Route path="providers-models" element={<AdminProvidersModelsPage />} />
              <Route path="content" element={<AdminContentPage />} />
              <Route path="security" element={<AdminSecurityPage />} />
              <Route path="jobs" element={<AdminOpsPage />} />
              <Route path="rag-diagnostics" element={<AdminOpsPage />} />
              <Route path="saas-system" element={<AdminSaaSSystemPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </RGBThemeProvider>
  );
}
