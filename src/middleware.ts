import { type NextRequest, NextResponse } from "next/server";

import {
  canAccessShopDashboard,
  getUserMetadata,
  isSSSystem,
  parseShopSlugFromPath,
} from "@/lib/auth/roles";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { DEFAULT_DASHBOARD_SLUG } from "@/lib/dashboard/constants";
import { isBillingBlocked } from "@/lib/tenants/billing";

const PUBLIC_DASHBOARD_PATHS = ["/dashboard/login"];
const SS_SYSTEM_ONLY_PATHS = ["/dashboard/tenants"];

async function redirectLegacyDashboardHtml(
  request: NextRequest,
): Promise<NextResponse> {
  const loginUrl = new URL("/dashboard/login", request.url);

  const { supabase } = createMiddlewareClient(request);
  if (!supabase) {
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const shopLogin = new URL(`/dashboard-${DEFAULT_DASHBOARD_SLUG}/login`, request.url);
    shopLogin.searchParams.set("return", "/dashboard");
    return NextResponse.redirect(shopLogin);
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
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

function isSunshineAdminPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === "/dashboard.html") {
    return redirectLegacyDashboardHtml(request);
  }

  const shopSlug = resolveShopSlug(path);
  const isShopDashboard = Boolean(shopSlug);
  const isAdminDashboard = isSunshineAdminPath(path) && !path.includes("dashboard-");

  if (!isAdminDashboard && !isShopDashboard) {
    return NextResponse.next();
  }

  if (isAdminDashboard && PUBLIC_DASHBOARD_PATHS.includes(path)) {
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
    if (isAdminDashboard) {
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

  if (isAdminDashboard) {
    const ssOnly = SS_SYSTEM_ONLY_PATHS.some(
      (p) => path === p || path.startsWith(`${p}/`),
    );
    if (ssOnly && !isSSSystem(role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (path === "/dashboard" && !isSSSystem(role) && !userSlug) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (path === "/dashboard" && !isSSSystem(role) && userSlug) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("plan_status")
        .eq("slug", userSlug)
        .maybeSingle();

      const planStatus = tenant?.plan_status as string | undefined;
      if (isBillingBlocked(planStatus) || planStatus === "past_due") {
        return NextResponse.redirect(
          new URL(`/shop/${userSlug}/billing`, request.url),
        );
      }
    }
  }

  if (isShopDashboard && shopSlug) {
    if (!canAccessShopDashboard(role, userSlug, shopSlug)) {
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
    "/dashboard/:path*",
    "/dashboard-:slug",
    "/dashboard-:slug/:path*",
    "/shop/:slug",
    "/shop/:slug/:path*",
  ],
};
