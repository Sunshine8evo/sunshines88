import { DM_Sans, Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";

import LoginForm from "@/components/auth/LoginForm";
import { getTenantBySlug } from "@/lib/tenants/db";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
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
    returnTo && returnTo.startsWith("/") ? returnTo : "/dashboard";

  return (
    <div className={`sunshine-login ${playfair.variable} ${dmSans.variable}`}>
      <div className="sl-card">
        <div className="sl-logo-wrap">
          <div className="sl-logo-mark">{tenant.shop_name.charAt(0).toUpperCase()}</div>
          <p className="sl-shop-name">{tenant.shop_name}</p>
          <h1 className="sl-heading">Welcome back</h1>
          <p className="sl-subtitle">Owner &amp; Staff sign in</p>
        </div>

        <LoginForm
          mode="owner_staff"
          slug={slug}
          redirectTo={redirectAfterLogin}
        />

        <p className="sl-footer">Powered by Sunshine Evolution Technology</p>
      </div>
    </div>
  );
}
