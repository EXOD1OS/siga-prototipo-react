import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credenciales',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const usuario = await prisma.usuario.findUnique({ where: { email: credentials.email } });
        if (!usuario) return null;

        const valid = await bcrypt.compare(credentials.password, usuario.passwordHash);
        if (!valid) return null;

        return {
          id: usuario.id,
          email: usuario.email,
          name: `${usuario.nombre} ${usuario.apellido}`,
          rol: usuario.rol,
          carreraId: usuario.carreraId,
          mustChangePassword: usuario.mustChangePassword,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.rol = (user as any).rol;
        token.carreraId = (user as any).carreraId;
        token.mustChangePassword = (user as any).mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).rol = token.rol;
        (session.user as any).carreraId = token.carreraId;
        (session.user as any).mustChangePassword = token.mustChangePassword;
      }
      return session;
    },
  },
};
