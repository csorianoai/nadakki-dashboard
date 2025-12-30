'use client';

// components/Providers.tsx - Client-side providers wrapper
import { TenantProvider } from '@/context/TenantContext';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <TenantProvider>
      {children}
    </TenantProvider>
  );
}
