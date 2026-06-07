import SunshineBrandLogo from "./SunshineBrandLogo";

type SunshineLogoProps = {
  size?: number;
  className?: string;
};

/** @deprecated Use SunshineBrandLogo — official logo from /public/assets/sunshine-logo.png */
export default function SunshineLogo({ size = 120, className = "" }: SunshineLogoProps) {
  return <SunshineBrandLogo width={size} className={className} />;
}
