import LoginForm from "@/components/auth/LoginForm";
import { dmSans } from "@/lib/fonts";

export default function SSLoginPage() {
  return (
    <div className={`sunshine-login ${dmSans.variable}`}>
      <div className="sl-card">
        <div className="sl-logo-wrap">
          <div className="sl-logo-mark">S</div>
          <h1 className="sl-heading">S System Login</h1>
        </div>

        <LoginForm mode="ss_system" redirectTo="/dashboard" />

        <p className="sl-footer">Powered by Sunshine Evolution Technology</p>
      </div>
    </div>
  );
}
