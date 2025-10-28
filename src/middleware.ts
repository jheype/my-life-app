import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(_req: NextRequest) {
  },
  {
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/todos/:path*",
    "/api/finance/:path*",
    "/api/workouts/:path*",
    "/api/diet/:path*",
  ],
};
