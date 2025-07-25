
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { Loader } from 'lucide-react';

interface PageWithAuthProps {
  children: React.ReactNode;
}

function AuthenticatedContent({ children }: PageWithAuthProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

// This is the key pattern - each page gets its own AuthProvider
export function PageWithAuth({ children }: PageWithAuthProps) {
  return (
    <AuthProvider>
      <AuthenticatedContent>{children}</AuthenticatedContent>
    </AuthProvider>
  );
}
