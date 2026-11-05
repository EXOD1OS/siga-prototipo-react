import type { Metadata } from 'next';
import './globals.css';
import { ReduxProvider } from '@/redux/provider';
import { AuthSessionProvider } from '@/components/AuthSessionProvider';

export const metadata: Metadata = {
  title: 'SIGA Planificaciones | DACEFyN - UNLaR',
  description: 'Sistema de Gestión de Planificaciones Docentes PAAC/PAAD - DACEFyN, UNLaR',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="bg-background text-gray-200 min-h-screen antialiased">
        <AuthSessionProvider>
          <ReduxProvider>{children}</ReduxProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
