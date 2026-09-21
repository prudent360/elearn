'use client';
import { usePathname } from 'next/navigation';
import { LearningProvider } from '@/context/LearningContext';
import { AppLayout } from './AppLayout';

// Reset links arrive from email and must render before (or without) a signed-in session — the
// page calls the API directly and manages its own state — so it skips the account gate and app
// chrome entirely instead of mounting LearningProvider/AppLayout. Email verification, by contrast,
// is entered while already signed in (right after registration), so it uses the normal app shell.
const publicRoutes = ['/reset-password'];

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (publicRoutes.includes(pathname)) return <>{children}</>;
  return (
    <LearningProvider>
      <AppLayout>{children}</AppLayout>
    </LearningProvider>
  );
}
