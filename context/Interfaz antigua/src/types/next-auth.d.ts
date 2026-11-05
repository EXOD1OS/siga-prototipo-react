import { UserRole } from '@prisma/client';
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      rol: UserRole;
      carreraId: string | null;
      mustChangePassword: boolean;
      name?: string | null;
      email?: string | null;
    };
  }

  interface User {
    id: string;
    rol: UserRole;
    carreraId: string | null;
    mustChangePassword: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    rol: UserRole;
    carreraId: string | null;
    mustChangePassword: boolean;
  }
}
