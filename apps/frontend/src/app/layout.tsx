import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nocena App',
  description: 'Nocena monorepo application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

