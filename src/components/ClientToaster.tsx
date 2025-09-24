'use client';

import { useLayoutEffect, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';

export function ClientToaster() {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <Toaster />;
}
