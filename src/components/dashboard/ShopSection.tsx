type ShopSectionProps = {
  title: string;
  body: string;
  href?: string;
  linkLabel?: string;
};

export default function ShopSection({
  title,
  body,
  href,
  linkLabel = "Open legacy view →",
}: ShopSectionProps) {
  return (
    <div className="rounded-2xl border border-[#eee] bg-white p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-[#666]">{body}</p>
      {href ? (
        <a href={href} className="mt-4 inline-block text-sm font-medium text-[#e87baa] hover:underline">
          {linkLabel}
        </a>
      ) : null}
    </div>
  );
}
