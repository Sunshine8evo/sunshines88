import { Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";

import SupabaseLoginForm from "@/components/auth/SupabaseLoginForm";
import SunshineBrandLogo from "@/components/marketing/SunshineBrandLogo";
import { getTenantBySlug } from "@/lib/tenants/db";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
});

export default async function ShopLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ return?: string }>;
}) {
  const { slug } = await params;
  const { return: returnTo } = await searchParams;
  const tenant = await getTenantBySlug(slug);

  if (!tenant) notFound();

  const redirectAfterLogin =
    returnTo && returnTo.startsWith("/") ? returnTo : `/dashboard-${slug}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#fdf0f3] via-white to-[#fce8ee] px-6 py-10">
      <SunshineBrandLogo width={120} className="mb-6" />
      <SupabaseLoginForm
        title={`Welcome back, ${tenant.shop_name}`}
        subtitle="Sign in with your email and password"
        expectedSlug={slug}
        redirectShopTo={redirectAfterLogin}
        legacyHref="/index.html"
        legacyLabel="Open legacy calendar system"
      />
      <p className={`mt-6 text-center text-xs text-[#999] ${playfair.className}`}>
        Customer booking:{" "}
        <a href={`/book/${slug}`} className="text-[#e87baa] hover:underline">
          /book/{slug}
        </a>
      </p>
    </div>
  );
}
