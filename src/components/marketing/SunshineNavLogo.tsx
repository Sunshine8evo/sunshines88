import SunshineBrandLogo from "./SunshineBrandLogo";

type SunshineNavLogoProps = {
  serifClassName?: string;
};

export default function SunshineNavLogo({ serifClassName = "" }: SunshineNavLogoProps) {
  return (
    <div className="sl-nav-logo">
      <SunshineBrandLogo width={120} className="sl-nav-logo-img" />
      <div className="sl-nav-logo-text">
        <div className="sl-nav-logo-title">Booking System</div>
        <div className="sl-nav-logo-sub">by Sunshine Evolution Technology</div>
      </div>
    </div>
  );
}
