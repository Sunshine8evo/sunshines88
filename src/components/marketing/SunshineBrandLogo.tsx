import { SUNSHINE_LOGO_SRC } from "@/lib/brand";

type SunshineBrandLogoProps = {
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
};

/** Renders the official Sunshine logo from /public/assets/sunshine-logo.png */
export default function SunshineBrandLogo({
  width = 220,
  height,
  className = "",
  alt = "Sunshine",
}: SunshineBrandLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SUNSHINE_LOGO_SRC}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{
        width,
        height: height ?? "auto",
        maxWidth: "100%",
        objectFit: "contain",
        background: "transparent",
      }}
    />
  );
}
