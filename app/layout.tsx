import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { WalletProvider } from '@/context/WalletContext';
import { NavActions } from '@/components/NavActions';
import { Target } from 'lucide-react';

const _geist = Geist({ subsets: ['latin'] });
const _geistMono = Geist_Mono({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stellar Habits — Web3 Habit Tracker',
  description:
    'Track daily habits on-chain and earn HABIT tokens for streaks — powered by Stellar Soroban smart contracts.',
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
          <nav className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
              {/* Brand */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <span className="font-bold text-foreground text-lg tracking-tight">
                  Stellar Habits
                </span>
                <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wide">
                  Testnet
                </span>
              </div>

              <NavActions />
            </div>
          </nav>

          <main className="max-w-6xl mx-auto px-4 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-border mt-16 py-6">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Stellar Habits &mdash; built on Stellar Soroban Testnet</span>
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                stellar.org
              </a>
            </div>
          </footer>
        </WalletProvider>
        <Analytics />
      </body>
    </html>
  );
}
