import React from 'react';
import { RouteProvider, useRoute } from './context/RouteContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Footer } from './components/layout/Footer.tsx';

// Pages
import { LandingPage } from './components/pages/LandingPage.tsx';
import { LoginPage } from './components/pages/LoginPage.tsx';
import { RegisterPage } from './components/pages/RegisterPage.tsx';
import { PublicVerificationPage } from './components/pages/PublicVerificationPage.tsx';
import { DashboardOverview } from './components/pages/DashboardOverview.tsx';
import { CheckWebsitePage } from './components/pages/CheckWebsitePage.tsx';
import { MyVerificationsPage } from './components/pages/MyVerificationsPage.tsx';
import { VerificationDetailPage } from './components/pages/VerificationDetailPage.tsx';
import { UserSettingsPage } from './components/pages/UserSettingsPage.tsx';

// Admin Pages
import { AdminDashboard } from './components/pages/admin/AdminDashboard.tsx';
import { AdminUsersPage } from './components/pages/admin/AdminUsersPage.tsx';
import { AdminVerificationsPage } from './components/pages/admin/AdminVerificationsPage.tsx';
import { AdminAuditLogsPage } from './components/pages/admin/AdminAuditLogsPage.tsx';
import { AdminSettingsPage } from './components/pages/admin/AdminSettingsPage.tsx';

// Legal Pages
import { LegalPage } from './components/pages/LegalPage.tsx';
import { ShieldAlert, LogIn, Lock } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentPath, navigate } = useRoute();
  const { currentUser, isLoading, isAdmin } = useAuth();

  // Helper for protected routes
  const requireAuth = (component: React.ReactNode) => {
    if (isLoading) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!currentUser) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Sign in Required</h2>
            <p className="text-xs text-slate-500">
              You must be signed in to access your verification dashboard and submit websites.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {component}
      </div>
    );
  };

  // Helper for admin protected routes
  const requireAdminAuth = (component: React.ReactNode) => {
    if (isLoading) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!currentUser || !isAdmin) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
            <p className="text-xs text-slate-500">
              Administrator privileges (ADMIN or SUPER_ADMIN) are required to access this area.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Return to User Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {component}
      </div>
    );
  };

  // Route Dispatcher
  const renderRoute = () => {
    // Public routes
    if (currentPath === '/') return <LandingPage />;
    if (currentPath === '/login') return <LoginPage />;
    if (currentPath === '/register') return <RegisterPage />;
    if (currentPath.startsWith('/verify/')) return <PublicVerificationPage />;

    // User Dashboard routes
    if (currentPath === '/dashboard') return requireAuth(<DashboardOverview />);
    if (currentPath === '/dashboard/check') return requireAuth(<CheckWebsitePage />);
    if (currentPath === '/dashboard/verifications') return requireAuth(<MyVerificationsPage />);
    if (currentPath.startsWith('/dashboard/verifications/')) return requireAuth(<VerificationDetailPage />);
    if (currentPath === '/dashboard/settings') return requireAuth(<UserSettingsPage />);

    // Admin routes
    if (currentPath === '/admin') return requireAdminAuth(<AdminDashboard />);
    if (currentPath === '/admin/users') return requireAdminAuth(<AdminUsersPage />);
    if (currentPath === '/admin/verifications') return requireAdminAuth(<AdminVerificationsPage />);
    if (currentPath.startsWith('/admin/verifications/')) return requireAdminAuth(<AdminVerificationsPage />);
    if (currentPath === '/admin/audit-logs') return requireAdminAuth(<AdminAuditLogsPage />);
    if (currentPath === '/admin/settings') return requireAdminAuth(<AdminSettingsPage />);

    // Legal / Informational
    if (currentPath === '/privacy') return <LegalPage type="privacy" />;
    if (currentPath === '/terms') return <LegalPage type="terms" />;
    if (currentPath === '/security') return <LegalPage type="security" />;
    if (currentPath === '/contact') return <LegalPage type="contact" />;

    // 404 Fallback
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-3xl font-extrabold text-slate-900">404</h2>
          <p className="text-sm text-slate-600">The requested page could not be located.</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-sky-500/20 selection:text-sky-900">
      <Navbar />
      <main className="flex-1">
        {renderRoute()}
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <RouteProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </RouteProvider>
  );
}
