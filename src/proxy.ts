import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Supabase stores the session in a cookie named sb-{project_ref}-auth-token
  // (may be chunked as .0, .1, etc.). Match any project ref so this keeps
  // working regardless of which Supabase project NEXT_PUBLIC_SUPABASE_URL points to.
  const hasSession = req.cookies.getAll().some(
    (c) => /^sb-.+-auth-token/.test(c.name)
  );

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.svg$).*)"],
};
