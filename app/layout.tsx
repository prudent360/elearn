import './globals.css';
import { LearningProvider } from '@/context/LearningContext';
import { AppLayout } from '@/components/layout/AppLayout';

export const metadata = {
  title: 'Tekskillup Academy | Modern Learning Workspace',
  description: 'A distraction-free, modern workspace for learning. Built for engineers, designers, and tech leaders.'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="light-theme">
        <a className="skip-link" href="#app-content">
          Skip to content
        </a>
        <LearningProvider>
          <AppLayout>{children}</AppLayout>
        </LearningProvider>
      </body>
    </html>
  );
}
