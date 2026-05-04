import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      passwordChangedAt: string | null;
    };
  }
  interface User {
    role: string;
    passwordChangedAt: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    passwordChangedAt: string | null;
  }
}
