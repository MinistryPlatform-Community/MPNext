import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/app/providers";
import { AuthWrapper, Header, DynamicBreadcrumb } from "@/components/layout";
import type { RuntimeConfig } from "@/contexts";

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
  // Read NEXT_PUBLIC_* vars server-side so they're available at runtime
  // (client components can't read process.env in standalone Docker builds)
  const runtimeConfig: RuntimeConfig = {
    mpFileUrl: process.env.NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL || null,
    appName: process.env.NEXT_PUBLIC_APP_NAME || "Pastor App",
  };

  return (
    <AuthWrapper>
      <Providers runtimeConfig={runtimeConfig}>
        <div className={`flex flex-col ${GeistSans.variable} ${GeistMono.variable}`}>
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
