import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Auto Garage - Service Centre Management',
  description: 'Complete garage management system for job cards, inventory, billing, and service tracking',
  keywords: ['garage', 'inventory', 'management', 'automobile', 'billing', 'job cards', 'service centre'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
