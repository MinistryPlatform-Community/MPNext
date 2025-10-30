import { Header } from "@/components/header";
import { AuthWrapper } from "@/components/auth-wrapper";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col">
      <AuthWrapper>
        <Header />

        <main className="flex-1 mt-16">
          <div className="px-4 py-3 border-b bg-muted/30">
            <DynamicBreadcrumb />
          </div>
          {children}
        </main>
      </AuthWrapper>
    </div>
  );
}
