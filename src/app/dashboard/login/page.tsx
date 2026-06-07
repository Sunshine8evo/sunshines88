import { DM_Sans, Playfair_Display } from "next/font/google";

import LoginForm from "@/components/auth/LoginForm";

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

export default function SSLoginPage() {
  return (
    <div className={`sunshine-login ${playfair.variable} ${dmSans.variable}`}>
      <div className="sl-card">
        <div className="sl-logo-wrap">
          <div className="sl-logo-mark">S</div>
          <h1 className="sl-heading">S System Login</h1>
          <p className="sl-subtitle">Sunshine Evolution Technology</p>
        </div>

        <LoginForm mode="ss_system" redirectTo="/dashboard" />

        <p className="sl-footer">www.sunshines88.com</p>
      </div>
    </div>
  );
}
