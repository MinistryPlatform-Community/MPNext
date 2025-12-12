import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "@/components/session-provider";

export async function AuthWrapper({ children }: { children: React.ReactNode }) {
  const session = await auth();

  console.log("AuthWrapper session: ", session);

  if (!session) {
    redirect("/api/auth/signin");
  }

  if (session.error === "RefreshTokenError") {
    redirect("/api/auth/signout?callbackUrl=/api/auth/signin");
  }

  return <SessionProvider session={session}>{children}</SessionProvider>;
}
