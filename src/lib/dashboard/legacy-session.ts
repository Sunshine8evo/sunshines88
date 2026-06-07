import { getUserMetadata, isSSSystem, normalizeRole } from "@/lib/auth/roles";

export type LegacySunshineUser = {
  username: string;
  role: string;
  name: string;
  displayName: string;
};

/** Map Supabase session → legacy index.html sessionStorage format. */
export function toLegacySunshineUser(
  user: {
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  } | null,
): LegacySunshineUser | null {
  if (!user) return null;

  const { role } = getUserMetadata(user);
  const normalized = normalizeRole(typeof role === "string" ? role : undefined);
  const metaName =
    typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null;
  const emailLocal = user.email?.split("@")[0] ?? "user";
  const displayName = metaName || emailLocal;

  if (isSSSystem(role)) {
    return {
      username: "sunshines",
      role: "ss_team",
      name: displayName,
      displayName,
    };
  }

  if (normalized === "owner") {
    const slug =
      typeof user.user_metadata?.slug === "string"
        ? user.user_metadata.slug
        : emailLocal;
    return {
      username: slug,
      role: "owner",
      name: displayName,
      displayName,
    };
  }

  return {
    username: emailLocal,
    role: "staff",
    name: displayName,
    displayName,
  };
}

export function writeLegacySunshineSession(user: LegacySunshineUser): void {
  sessionStorage.setItem("sunshine_user", JSON.stringify(user));
}
