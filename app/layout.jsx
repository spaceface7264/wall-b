import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./providers/ToastProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import ChatNotification from "./components/ChatNotification"; 


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wall-B",
  description: "Wall-B - A modern bouldering community app with real-time chat, gym database, and social features",
};

// viewport export not supported in Next.js 14.2.13

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased mobile-app`}
      >
        <ErrorBoundary>
          <ToastProvider>
            {children}
            <ChatNotification userId={null} />
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}