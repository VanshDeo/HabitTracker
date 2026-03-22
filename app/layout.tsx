import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { WalletProvider } from '@/context/WalletContext';
import { NavActions } from '@/components/NavActions';

const _geist = Geist({ subsets: ['latin'] });
const _geistMono = Geist_Mono({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stellar Habits — Web3 Habit Tracker',
  description:
    'Track daily habits and earn HABIT tokens for streaks — powered by Stellar Soroban smart contracts.',
  generator: 'v0.app',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <WalletProvider>
          {/* Sticky navigation bar */}
          <nav className="bg-card border-b border-border sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl select-none" aria-hidden>🎯</span>
                <span className="font-bold text-foreground text-lg tracking-tight">
                  Stellar Habits
                </span>
                <span className="hidden sm:inline-block ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wide">
                  Testnet
                </span>
              </div>
              <NavActions />
            </div>
          </nav>

          <main className="max-w-6xl mx-auto px-4 py-8">
            {children}
          </main>
        </WalletProvider>
        <Analytics />
      </body>
    </html>
  );
}
