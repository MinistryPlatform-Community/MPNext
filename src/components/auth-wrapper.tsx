import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "@/contexts";

export async function AuthWrapper({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  if (session.error === "RefreshTokenError") {
    redirect("/api/auth/signout?callbackUrl=/api/auth/signin");
  }

  return <SessionProvider session={session}>{children}</SessionProvider>;
}
