import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/app/providers";
import { AuthWrapper } from "@/components/auth-wrapper";
import { Header } from "@/components/header";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pastor App",
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
      <Providers>
        <div className={`flex flex-col ${geistSans.variable} ${geistMono.variable}`}>
          <Header />
          <main className="flex-1 mt-16">
            <div className="px-4 py-3 border-b bg-muted/30">
              <DynamicBreadcrumb />
            </div>
            {children}
          </main>
        </div>
      </Providers>
    </AuthWrapper>
  );
}
