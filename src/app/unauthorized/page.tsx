import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdf5fb] px-6 text-center">
      <h1 className="text-3xl font-bold text-[#2d1a2e]">Access denied</h1>
      <p className="mt-3 max-w-md text-sm text-[#666]">
        You do not have permission to view this page. Please sign in with the correct account.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/login"
          className="rounded-full bg-gradient-to-r from-[#f07d96] to-[#e87baa] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
        <Link
          href="/"
          className="rounded-full border border-[#e5e5e5] bg-white px-5 py-2.5 text-sm font-medium text-[#666]"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
