import { AuthWrapper } from "@/components/auth-wrapper";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthWrapper>
      {children}
    </AuthWrapper>
  );
}
