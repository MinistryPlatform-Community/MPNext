import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ServerProviders } from "@/app/server-providers";
import {
  AuthWrapper,
  Header,
  HeaderSkeleton,
  DynamicBreadcrumb,
} from "@/components/layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "MPNext",
  description: "Ministry Platform Pastor Application",
  icons: {
    icon: "/assets/icons/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
}

export default async function WebLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthWrapper>
      <ServerProviders>
        <div className={`flex flex-col ${geistSans.variable} ${geistMono.variable}`}>
          {/*
            Header should never suspend — only its avatar reads the MP profile,
            behind its own boundary. This is a safety net, and its fallback must
            be the fixed header skeleton: an in-flow placeholder here pushed all
            of <main> down 64px (on top of its mt-16) on every page load.
          */}
          <Suspense fallback={<HeaderSkeleton />}>
            <Header />
          </Suspense>
          <main className="flex-1 mt-16">
            <div className="px-4 py-3 border-b bg-muted/30">
              <DynamicBreadcrumb />
            </div>
            {children}
          </main>
        </div>
      </ServerProviders>
    </AuthWrapper>
  );
}
