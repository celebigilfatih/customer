import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
<<<<<<< HEAD
import { AppShell } from "@/components/app-shell";
=======
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
>>>>>>> 3e3797c3baed7fa069b92dfdf0f0b4f0ac8fc26d

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Turnuva Yönetim Sistemi",
  description: "Turnuva katılım ve takım yönetim sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<<<<<<< HEAD
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <AppShell>
          {children}
        </AppShell>
=======
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
>>>>>>> 3e3797c3baed7fa069b92dfdf0f0b4f0ac8fc26d
      </body>
    </html>
  );
}
