import { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { findUserByEmail, createUser, findUserByProviderId } from '@/lib/users';
import { comparePassword } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

// Only include Google provider if credentials are configured
const providers: NextAuthOptions['providers'] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    })
  );
} else {
  console.warn('⚠️  Google OAuth not configured: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required');
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise) as any,
  providers: [
    ...providers,
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await findUserByEmail(credentials.email);
        
        if (!user) {
          throw new Error('Invalid email or password');
        }

        if (user.provider !== 'credentials') {
          throw new Error('Please sign in with the method you used to register');
        }

        if (!user.password) {
          throw new Error('Invalid email or password');
        }

        const isValidPassword = await comparePassword(credentials.password, user.password);
        
        if (!isValidPassword) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user._id?.toString() || '',
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        // Check if user exists by Google ID
        const existingUser = account.providerAccountId
          ? await findUserByProviderId(account.providerAccountId)
          : null;

        if (!existingUser) {
          // Create new user from Google
          const newUser = await createUser({
            email: user.email || '',
            name: user.name || 'User',
            image: user.image || undefined,
            provider: 'google',
            providerId: account.providerAccountId,
          });

          if (!newUser) {
            return false;
          }
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'triposia-nextauth-secret-2024',
};

