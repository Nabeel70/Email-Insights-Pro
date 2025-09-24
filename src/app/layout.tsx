
import type { Metadata } from 'next';
import './globals.css';
import { ClientToaster } from "@/components/ClientToaster"
import { AuthProvider } from "@/lib/auth-context"
import { ClientOnly } from "@/components/ClientOnly"
import { AppLayout } from "@/components/app-layout"

export const metadata: Metadata = {
  title: 'Email Insights Pro',
  description: 'AI-powered email campaign analysis',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <div suppressHydrationWarning>
          <AuthProvider>
            <ClientOnly>
              <AppLayout>
                {children}
              </AppLayout>
            </ClientOnly>
            <ClientToaster />
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
