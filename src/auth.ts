import NextAuth from "next-auth"
import { JWT } from "next-auth/jwt"
import { MinistryPlatformAuthProvider } from "@/lib/providers/ministry-platform/auth"
import { MPHelper } from "@/lib/providers/ministry-platform"
import { MPUserProfile } from "@/lib/providers/ministry-platform/types"


export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MinistryPlatformAuthProvider({
      clientId: process.env.OIDC_CLIENT_ID!,
      clientSecret: process.env.OIDC_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },  
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async jwt({ token, account, profile, trigger }): Promise<JWT> {
      console.log('JWT Callback - trigger:', trigger, 'account:', !!account, 'token exists:', !!token, 'profile:', !!profile)
      
      if (account && profile) {
        console.log('JWT Callback - Setting initial token from account')

        const mp = new MPHelper();
        let userProfile: MPUserProfile | null = null;
        
        try {
          const records = await mp.getTableRecords<MPUserProfile>({
            table: "dp_Users",
            filter: `User_GUID = '${profile.sub}'`,
            select: "User_ID,User_GUID,Contact_ID,Contact_ID_TABLE.First_Name,Contact_ID_TABLE.Nickname,Contact_ID_TABLE.Last_Name,Contact_ID_TABLE.Email_Address,Contact_ID_TABLE.Mobile_Phone,Contact_ID_TABLE.dp_fileUniqueId AS Image_GUID",
            top: 1
          });
          userProfile = records[0] || null;
          console.log('JWT Callback - Fetched user profile:', !!userProfile);
        } catch (error) {
          console.error('JWT Callback - Error fetching user profile:', error);
        }

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          idToken: account.id_token,
          sub: profile.sub,
          userId: profile.user_id,
          email: profile.email,
          name: profile.name,
          firstName: profile.given_name,
          lastName: profile.family_name,
          userProfile,
        } as JWT
      }
    
      if (!token) {
        console.log('JWT Callback - No token available')
        return token
      }

      // Check if token is expired and refresh if needed
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        console.log('JWT Callback - Token still valid')
        return token
      }
    
      console.log('JWT Callback - Token expired, attempting refresh')
      
      // Token is expired, try to refresh it
      if (token.refreshToken) {
        try {
          const response = await fetch(`${process.env.MINISTRY_PLATFORM_BASE_URL}/oauth/connect/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: token.refreshToken as string,
              client_id: process.env.OIDC_CLIENT_ID!,
              client_secret: process.env.OIDC_CLIENT_SECRET!,
            }),
          })
        
          if (response.ok) {
            const refreshedTokens = await response.json()
            console.log('JWT Callback - Token refreshed successfully')
            return {
              ...token,
              accessToken: refreshedTokens.access_token,
              expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
              refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
            } as JWT
          } else {
            console.error('JWT Callback - Failed to refresh token:', response.status)
            return { ...token, error: "RefreshTokenError" } as JWT
          }
        } catch (error) {
          console.error('JWT Callback - Error refreshing token:', error)
          return { ...token, error: "RefreshTokenError" } as JWT
        }
      }
    
      console.log('JWT Callback - No refresh token available')
      return { ...token, error: "RefreshTokenError" } as JWT
    },
  async session({ session, token }) {
    console.log('Session Callback - token exists:', !!token)
    console.log('Token sub:', token?.sub)
    
    if (token && session.user) {
      session.user.id = token.sub as string
      session.accessToken = token.accessToken as string
      session.firstName = token.firstName as string
      session.lastName = token.lastName as string
      session.email = token.email as string
      session.sub = token.sub as string
      session.idToken = token.idToken as string
      session.userProfile = token.userProfile as MPUserProfile | null
      session.error = token.error as string | undefined
    }
    
    console.log('Final session user ID:', session.user?.id)
    return session
  },
  },
})