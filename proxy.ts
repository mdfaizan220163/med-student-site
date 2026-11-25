import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Learning tools are intentionally accessible without an account.
  // Supabase outages or missing login cookies must not block their pages.
  const isAccount = pathname === "/account" || pathname.startsWith("/account/");
  const isLogin = pathname === "/login";

  if (!isAccount && !isLogin) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    if (isAccount) {
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

    if (isAccount && !claims) {
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
    if (isAccount) {
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
