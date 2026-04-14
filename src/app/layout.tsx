import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { FeatureRequestChatWidget } from "@/components/FeatureRequestChatWidget";
import { QueryClientProvider } from "@/lib/query-client";

const interSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://spikeball.ddns.net'),
  title: {
    default: 'Spikeball ELO Ranking Deutschland - Turnier-Statistik',
    template: '%s | Spikeball ELO Ranking'
  },
  description: "Das ELO Ranking für Spikeball Deutschland. Tracke Turnier-Ergebnisse, Spieler-Statistiken und verbessere deine Spikeball-Erfahrung. Wer führt das aktuelle Ranking an?",
  keywords: "spikeball, spikeball deutschland, elo ranking, spikeball-turnier, mannsspiel-statistik, spikeball-elo, turnier-erstellung",
  authors: [{ name: "Spikeball Deutschland" }],
  openGraph: {
    title: "Spikeball ELO Ranking Deutschland",
    description: "Wer führt das Spikeball Ranking an? Tracke deine Statistiken und verbessere dein Matchup-Balancing.",
    type: "website",
    url: "https://spikeball.ddns.net",
    siteName: "Spikeball Ranking Deutschland",
    images: [{
      url: '/spikeball-logo.png',
      width: 1200,
      height: 630,
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spikeball ELO Ranking Deutschland",
    description: "Spieler-Statistiken & Leaderboard für Spikeball Deutschland",
    images: ['/spikeball-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning className="dark">
      <head>
        <title>Startseite von Spikeball.ddns.net</title>
        <meta name="google-site-verification" content="4srOQszXNlJ0b1JYxxiIAfcIHZhWEh46PFNL0urItuk" />
      </head>
      <body
        className={`${interSans.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <QueryClientProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            {children}
            <Toaster />
            <SonnerToaster />
            <FeatureRequestChatWidget />
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
