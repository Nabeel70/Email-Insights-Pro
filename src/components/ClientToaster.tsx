'use client';

import { useLayoutEffect, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';

export function ClientToaster() {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    // Use layoutEffect to ensure DOM is ready before mounting
    // This helps prevent hydration mismatches from browser extensions
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <Toaster />;
}
