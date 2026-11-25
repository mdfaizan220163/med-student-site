import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedPath = [
    "/ai-studio",
    "/presentation-studio",
    "/study-notebook",
    "/account",
  ].some((path) => pathname === path || pathname.startsWith(path + "/"));
  const isLogin = pathname === "/login";

  // Public pages must not depend on Supabase being reachable. This keeps
  // navigation and public content working during an auth/network outage.
  if (!protectedPath && !isLogin) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    if (protectedPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.getClaims();
    if (error) throw error;
    const claims = data?.claims ?? null;

    if (protectedPath && !claims) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (isLogin && claims) {
      const url = request.nextUrl.clone();
      url.pathname = "/account";
      url.search = "";
      return NextResponse.redirect(url);
    }
  } catch {
    // Do not turn an auth-provider outage into a site-wide navigation outage.
    // Let the login page display and report its own actionable auth error.
    if (protectedPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      url.searchParams.set("auth_error", "unavailable");
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
