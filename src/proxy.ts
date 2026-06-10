import { NextRequest, NextResponse } from "next/server";

const PROJECT_REF = "akconcfovweywvmnrneq";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Supabase stores session in sb-{project_ref}-auth-token (may be chunked as .0, .1, etc.)
  const hasSession = req.cookies.getAll().some(
    (c) => c.name.startsWith(`sb-${PROJECT_REF}-auth-token`)
  );

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.svg$).*)"],
};
