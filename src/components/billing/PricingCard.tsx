type PricingCardProps = {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
  onSelect: () => void;
};

export default function PricingCard({
  name,
  price,
  features,
  highlighted = false,
  onSelect,
}: PricingCardProps) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        highlighted ? "border-[#e87baa] bg-[#fde8f2]/40" : "border-[#f0d9ec] bg-white"
      }`}
    >
      <h3 className="text-lg font-semibold text-[#2d1a2e]">{name}</h3>
      <p className="mt-2 text-3xl font-bold text-[#7c5aad]">
        ${price}
        <span className="text-sm font-normal text-[#9a6d95]">/mo</span>
      </p>
      <ul className="mt-4 space-y-2 text-sm text-[#6b6b7b]">
        {features.map((f) => (
          <li key={f}>✓ {f}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onSelect}
        className="mt-6 w-full rounded-full bg-[#e87baa] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#c0477a]"
      >
        Start Free Trial
      </button>
    </div>
  );
}
