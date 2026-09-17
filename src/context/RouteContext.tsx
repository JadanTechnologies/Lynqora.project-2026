import React, { createContext, useContext, useState, useEffect } from 'react';

interface RouteContextType {
  currentPath: string;
  navigate: (path: string) => void;
  params: Record<string, string>;
}

const RouteContext = createContext<RouteContextType>({
  currentPath: '/',
  navigate: () => {},
  params: {},
});

export const RouteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (path: string) => {
    if (path !== window.location.pathname) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Helper to extract path params (e.g. /verify/:id or /dashboard/verifications/:id)
  const params: Record<string, string> = {};
  if (currentPath.startsWith('/verify/')) {
    params.verificationId = currentPath.replace('/verify/', '');
  } else if (currentPath.startsWith('/dashboard/verifications/')) {
    params.verificationId = currentPath.replace('/dashboard/verifications/', '');
  } else if (currentPath.startsWith('/admin/verifications/')) {
    params.verificationId = currentPath.replace('/admin/verifications/', '');
  }

  return (
    <RouteContext.Provider value={{ currentPath, navigate, params }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRoute = () => useContext(RouteContext);
