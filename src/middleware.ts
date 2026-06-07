import { type NextRequest, NextResponse } from "next/server";

import {
  canAccessShopDashboard,
  getUserMetadata,
  isSSSystem,
  parseShopSlugFromPath,
} from "@/lib/auth/roles";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { isBillingBlocked } from "@/lib/tenants/billing";

const SS_SYSTEM_ONLY_PATHS: string[] = [];

function resolveShopSlug(pathname: string): string | null {
  return (
    parseShopSlugFromPath(pathname) ??
    pathname.match(/^\/shop\/([^/]+)/)?.[1] ??
    null
  );
}

function isBillingPath(pathname: string, slug: string): boolean {
  return (
    pathname === `/shop/${slug}/billing` ||
    pathname === `/dashboard-${slug}/billing`
  );
}

function isSunshineAdminPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

function isLegacyLoginPath(pathname: string): boolean {
  return (
    pathname === "/dashboard/login" ||
    pathname.match(/^\/dashboard-[^/]+\/login$/) !== null ||
    pathname.match(/^\/shop\/[^/]+\/login$/) !== null
  );
}

async function redirectLegacyDashboardHtml(
  request: NextRequest,
): Promise<NextResponse> {
  const { supabase } = createMiddlewareClient(request);
  if (!supabase) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { role, slug: userSlug } = getUserMetadata(session.user);

  if (isSSSystem(role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (userSlug) {
    return NextResponse.redirect(new URL(`/dashboard-${userSlug}`, request.url));
  }

  return NextResponse.redirect(new URL("/unauthorized", request.url));
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === "/dashboard.html") {
    return redirectLegacyDashboardHtml(request);
  }

  if (isLegacyLoginPath(path)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (path === "/login") {
    return NextResponse.next();
  }

  const shopSlug = resolveShopSlug(path);
  const isShopDashboard = Boolean(shopSlug);
  const isAdminDashboard = isSunshineAdminPath(path) && !path.includes("dashboard-");

  if (!isAdminDashboard && !isShopDashboard) {
    return NextResponse.next();
  }

  const { supabase, response } = createMiddlewareClient(request);

  if (!supabase) {
    return response;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { role, slug: userSlug } = getUserMetadata(session.user);

  if (isAdminDashboard) {
    if (!isSSSystem(role)) {
      if (userSlug) {
        return NextResponse.redirect(
          new URL(`/dashboard-${userSlug}`, request.url),
        );
      }
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    const ssOnly = SS_SYSTEM_ONLY_PATHS.some(
      (p) => path === p || path.startsWith(`${p}/`),
    );
    if (ssOnly && !isSSSystem(role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (isShopDashboard && shopSlug) {
    if (!canAccessShopDashboard(role, userSlug, shopSlug)) {
      if (userSlug) {
        return NextResponse.redirect(
          new URL(`/dashboard-${userSlug}`, request.url),
        );
      }
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (!isSSSystem(role) && !isBillingPath(path, shopSlug)) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("plan_status")
        .eq("slug", shopSlug)
        .maybeSingle();

      const planStatus = tenant?.plan_status as string | undefined;
      if (isBillingBlocked(planStatus) || planStatus === "past_due") {
        return NextResponse.redirect(
          new URL(`/shop/${shopSlug}/billing`, request.url),
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard.html",
    "/login",
    "/dashboard/login",
    "/dashboard/:path*",
    "/dashboard-:slug",
    "/dashboard-:slug/:path*",
    "/shop/:slug",
    "/shop/:slug/:path*",
  ],
};
