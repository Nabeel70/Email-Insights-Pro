'use client';

import { Navigation } from './navigation';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Don't show navigation on login page
  if (pathname === '/login' || !user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
