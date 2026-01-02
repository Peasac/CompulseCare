import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CompulseCare - OCD & Compulsion Tracking",
  description: "Your compassionate companion for managing OCD and compulsive behaviors. Track, understand, and grow.",
  keywords: ["OCD", "mental health", "compulsion tracking", "anxiety", "wellness"],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

// Commit message: feat: create root layout with Inter font and metadata
