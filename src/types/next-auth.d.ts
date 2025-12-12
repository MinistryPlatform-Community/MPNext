import { DefaultSession } from "next-auth"
import { MPUserProfile } from "@/lib/providers/ministry-platform/types"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
    accessToken?: string
    firstName?: string
    lastName?: string
    email?: string
    sub?: string
    idToken?: string
    userProfile?: MPUserProfile | null
    error?: string
  }

  interface JWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    userId?: string
    firstName?: string
    lastName?: string
    idToken?: string
    userProfile?: MPUserProfile | null
    error?: string
  }
}