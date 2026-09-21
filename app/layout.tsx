import './globals.css';
import { RootShell } from '@/components/layout/RootShell';

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
        <meta name="theme-color" content="#f6f7fb" />
      </head>
      <body className="light-theme">
        <a className="skip-link" href="#app-content">
          Skip to content
        </a>
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}
