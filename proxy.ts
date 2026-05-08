import { withAuth } from "next-auth/middleware";

export const proxy = withAuth({
  callbacks: {
    authorized({ req, token }) {
      const path = req.nextUrl.pathname;
      if (path === "/" || path.startsWith("/login") || path.startsWith("/register")) {
        return true;
      }
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
