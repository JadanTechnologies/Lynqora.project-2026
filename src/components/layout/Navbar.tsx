import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRoute } from '../../context/RouteContext.tsx';
import { 
  ShieldCheck, 
  Search, 
  LayoutDashboard, 
  ListOrdered, 
  ShieldAlert, 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  Menu, 
  X, 
  ChevronDown,
  KeyRound,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, logout, isAdmin, notifications, unreadCount, markNotificationRead, markAllNotificationsRead, login } = useAuth();
  const { currentPath, navigate } = useRoute();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [devDemoOpen, setDevDemoOpen] = useState(false);
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);

  const handleQuickLogin = async (email: string, pass: string) => {
    setQuickLoginLoading(true);
    try {
      await login(email, pass);
      setDevDemoOpen(false);
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Login failed');
    } finally {
      setQuickLoginLoading(false);
    }
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Check Website', path: '/dashboard/check', authRequired: true },
    { label: 'Dashboard', path: '/dashboard', authRequired: true },
    { label: 'My Verifications', path: '/dashboard/verifications', authRequired: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      {/* Dev Demo Credentials Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 flex flex-wrap items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-semibold tracking-wide">
            PHASE 1 FOUNDATION
          </span>
          <span className="hidden sm:inline text-slate-400">
            Development Testing Credentials:
          </span>
          <span className="font-mono text-slate-200">
            admin@lynqora.com <span className="text-slate-500">|</span> demo@lynqora.com
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                id="quick-login-demo"
                onClick={() => handleQuickLogin('demo@lynqora.com', 'DemoUser!2026')}
                disabled={quickLoginLoading}
                className="hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px] font-medium"
              >
                1-Click Demo Login
              </button>
              <button
                id="quick-login-admin"
                onClick={() => handleQuickLogin('admin@lynqora.com', 'ChangeMe!2026')}
                disabled={quickLoginLoading}
                className="hover:text-white px-2 py-0.5 rounded bg-sky-950 text-sky-300 hover:bg-sky-900 border border-sky-800/60 transition-colors text-[11px] font-medium"
              >
                1-Click Super Admin
              </button>
            </div>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Signed in as {currentUser.email} ({currentUser.role})
            </span>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              id="brand-logo-button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-sky-400 shadow-sm shadow-slate-900/10 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1">
                  Lynqora
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    Phase 1
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-tight -mt-1 hidden sm:inline">
                  Know Who You Trust Online
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              if (link.authRequired && !currentUser) return null;
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  id={`nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => navigate(link.path)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}

            {/* Admin link for Admin/SuperAdmin */}
            {isAdmin && (
              <button
                id="nav-link-admin-panel"
                onClick={() => navigate('/admin')}
                className={`px-3 py-1.5 ml-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-colors flex items-center gap-1.5 ${
                  currentPath.startsWith('/admin')
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/60'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Admin Panel
              </button>
            )}
          </nav>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <>
                {/* Notifications Dropdown */}
                <div className="relative">
                  <button
                    id="notifications-bell-button"
                    onClick={() => {
                      setNotifDropdownOpen(!notifDropdownOpen);
                      setUserDropdownOpen(false);
                    }}
                    className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-sky-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                          Notifications ({notifications.length})
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllNotificationsRead}
                            className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div
                              key={n.id}
                              onClick={() => markNotificationRead(n.id)}
                              className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                                !n.read ? 'bg-sky-50/40' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0 mt-1"></span>}
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                              <span className="text-[10px] text-slate-400 block mt-1">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Menu */}
                <div className="relative">
                  <button
                    id="user-profile-menu-button"
                    onClick={() => {
                      setUserDropdownOpen(!userDropdownOpen);
                      setNotifDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left hidden lg:block">
                      <div className="text-xs font-semibold text-slate-900 leading-tight">
                        {currentUser.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {currentUser.role}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-slate-100 text-slate-700">
                          {currentUser.role}
                        </span>
                      </div>

                      <button
                        id="user-menu-dashboard"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('/dashboard');
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                        Dashboard
                      </button>

                      <button
                        id="user-menu-settings"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('/dashboard/settings');
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        Account Settings
                      </button>

                      {isAdmin && (
                        <button
                          id="user-menu-admin"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            navigate('/admin');
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-medium text-sky-700 hover:bg-sky-50 flex items-center gap-2"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-sky-600" />
                          Admin Console
                        </button>
                      )}

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        id="user-menu-logout"
                        onClick={async () => {
                          setUserDropdownOpen(false);
                          await logout();
                          navigate('/');
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-button"
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </button>
                <button
                  id="nav-register-button"
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          {navLinks.map(link => {
            if (link.authRequired && !currentUser) return null;
            return (
              <button
                key={link.path}
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(link.path);
                }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {link.label}
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/admin');
              }}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-sky-700 bg-sky-50"
            >
              Super Admin Panel
            </button>
          )}

          <div className="border-t border-slate-100 pt-3">
            {currentUser ? (
              <div className="space-y-2">
                <div className="text-xs text-slate-500">
                  Signed in as <span className="font-semibold text-slate-800">{currentUser.email}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/dashboard/settings');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md"
                >
                  Account Settings
                </button>
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await logout();
                    navigate('/');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-md"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className="w-full py-2 text-center text-sm font-medium text-slate-800 border border-slate-200 rounded-lg"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/register');
                  }}
                  className="w-full py-2 text-center text-sm font-semibold text-white bg-slate-900 rounded-lg"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
