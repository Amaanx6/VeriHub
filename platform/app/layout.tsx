import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/ui/PageTransition';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VeriHub - AI-Powered Misinformation Detection Browser Extension',
  description: 'Stop misinformation before it spreads. VeriHub uses advanced AI to detect fake news and misinformation directly in your browser in real-time.',
  keywords: 'misinformation, fake news, browser extension, AI, fact checking, digital literacy',
  authors: [{ name: 'VeriHub Team' }],
  openGraph: {
    title: 'VeriHub - Stop Misinformation Before It Spreads',
    description: 'Advanced AI detects fake news and misinformation directly in your browser',
    type: 'website',
    siteName: 'VeriHub',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VeriHub - AI-Powered Misinformation Detection',
    description: 'Stop misinformation before it spreads with real-time AI detection',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background flex flex-col`}>
        <Header />
        <PageTransition>
          <main className="flex-1 relative">
            {children}
          </main>
        </PageTransition>
        <Footer />
      </body>
    </html>
  );
}