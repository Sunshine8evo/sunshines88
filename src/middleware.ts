import { type NextRequest, NextResponse } from "next/server";

import {
  canAccessShopDashboard,
  getUserMetadata,
  isSunshineAdmin,
  parseShopSlugFromPath,
} from "@/lib/auth/roles";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { isBillingBlocked } from "@/lib/tenants/billing";

const PUBLIC_DASHBOARD_PATHS = ["/dashboard/login"];
const DEFAULT_SHOP_SLUG = "sunshinetest";

async function redirectLegacyDashboardHtml(
  request: NextRequest,
): Promise<NextResponse> {
  const loginUrl = new URL("/dashboard/login", request.url);
  loginUrl.searchParams.set("return", "/dashboard.html");

  const { supabase } = createMiddlewareClient(request);

  if (!supabase) {
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(loginUrl);
  }

  const { slug } = getUserMetadata(session.user);
  const targetSlug = slug || DEFAULT_SHOP_SLUG;

  return NextResponse.redirect(
    new URL(`/dashboard-${targetSlug}`, request.url),
  );
}

function resolveShopSlug(pathname: string): string | null {
  return (
    parseShopSlugFromPath(pathname) ??
    pathname.match(/^\/shop\/([^/]+)/)?.[1] ??
    null
  );
}

function isPublicShopPath(pathname: string, slug: string): boolean {
  return (
    pathname === `/dashboard-${slug}/login` || pathname === `/shop/${slug}/login`
  );
}

function isBillingPath(pathname: string, slug: string): boolean {
  return (
    pathname === `/shop/${slug}/billing` ||
    pathname === `/dashboard-${slug}/billing`
  );
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === "/dashboard.html") {
    return redirectLegacyDashboardHtml(request);
  }

  const isSunshineDashboard =
    path === "/dashboard" || path.startsWith("/dashboard/");
  const shopSlug = resolveShopSlug(path);
  const isShopDashboard = Boolean(shopSlug);

  if (!isSunshineDashboard && !isShopDashboard) {
    return NextResponse.next();
  }

  if (isSunshineDashboard && PUBLIC_DASHBOARD_PATHS.includes(path)) {
    return NextResponse.next();
  }

  if (isShopDashboard && shopSlug && isPublicShopPath(path, shopSlug)) {
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
    if (isSunshineDashboard) {
      return NextResponse.redirect(new URL("/dashboard/login", request.url));
    }
    if (shopSlug) {
      return NextResponse.redirect(
        new URL(`/dashboard-${shopSlug}/login`, request.url),
      );
    }
    return response;
  }

  const { role, slug: userSlug } = getUserMetadata(session.user);

  if (isSunshineDashboard && !path.includes("dashboard-")) {
    if (!isSunshineAdmin(role)) {
      if (userSlug) {
        return NextResponse.redirect(
          new URL(`/dashboard-${userSlug}`, request.url),
        );
      }
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  if (isShopDashboard && shopSlug) {
    if (!canAccessShopDashboard(role, userSlug, shopSlug)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (!isSunshineAdmin(role) && supabase && !isBillingPath(path, shopSlug)) {
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
    "/dashboard/:path*",
    "/dashboard-:slug",
    "/dashboard-:slug/:path*",
    "/shop/:slug",
    "/shop/:slug/:path*",
  ],
};
