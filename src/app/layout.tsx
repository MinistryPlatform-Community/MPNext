import { AuthWrapper } from "@/components/auth-wrapper";
import "./globals.css";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthWrapper>
        {children}
        </AuthWrapper>
      </body>
    </html>
  );
}