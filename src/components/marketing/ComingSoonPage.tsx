import SunshineBrandLogo from "./SunshineBrandLogo";
import { dmSans } from "@/lib/fonts";

export default function ComingSoonPage() {
  return (
    <div className={`cs-page ${dmSans.className}`}>
      <div className="cs-blob cs-blob--1" aria-hidden="true" />
      <div className="cs-blob cs-blob--2" aria-hidden="true" />

      <div className="cs-ripple-wrap" aria-hidden="true">
        <div className="cs-ripple" />
        <div className="cs-ripple" />
        <div className="cs-ripple" />
        <div className="cs-ripple" />
        <div className="cs-ripple" />
        <div className="cs-ripple" />
        <div className="cs-ripple" />
      </div>

      <main className="cs-content">
        <div className="cs-logo-wrap">
          <SunshineBrandLogo width={300} className="cs-brand-logo" />
        </div>
        <div className="cs-brand-name">Sunshine Booking System</div>
        <div className="cs-sub-name">by Sunshine Evolution Technology</div>
        <h1 className="cs-coming-soon">Coming Soon</h1>
        <div className="cs-dots" aria-hidden="true">
          <div className="cs-dot" />
          <div className="cs-dot" />
          <div className="cs-dot" />
        </div>
      </main>

      <footer className="cs-footer">
        <a href="https://www.sunshines88.com">www.sunshines88.com</a>
        &nbsp;·&nbsp; Sunshine Evolution Technology &nbsp;·&nbsp; © 2025
      </footer>

      <style>{`
        .cs-page {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #fdf5fb;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cs-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.25;
        }
        .cs-blob--1 {
          width: 400px;
          height: 400px;
          background: #e87baa;
          top: -120px;
          right: -100px;
        }
        .cs-blob--2 {
          width: 350px;
          height: 350px;
          background: #b89fd4;
          bottom: -100px;
          left: -80px;
        }
        .cs-ripple-wrap {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .cs-ripple {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(232, 123, 170, 0.35);
          animation: cs-ripple 4s cubic-bezier(0.2, 0.6, 0.4, 1) infinite;
        }
        .cs-ripple:nth-child(1) { width: 160px; height: 160px; animation-delay: 0s; }
        .cs-ripple:nth-child(2) { width: 280px; height: 280px; animation-delay: 0.6s; border-color: rgba(184, 159, 212, 0.3); }
        .cs-ripple:nth-child(3) { width: 420px; height: 420px; animation-delay: 1.2s; border-color: rgba(232, 123, 170, 0.22); }
        .cs-ripple:nth-child(4) { width: 580px; height: 580px; animation-delay: 1.8s; border-color: rgba(184, 159, 212, 0.18); }
        .cs-ripple:nth-child(5) { width: 760px; height: 760px; animation-delay: 2.4s; border-color: rgba(232, 123, 170, 0.12); }
        .cs-ripple:nth-child(6) { width: 960px; height: 960px; animation-delay: 3s; border-color: rgba(184, 159, 212, 0.08); }
        .cs-ripple:nth-child(7) { width: 1180px; height: 1180px; animation-delay: 3.6s; border-color: rgba(232, 123, 170, 0.05); }
        @keyframes cs-ripple {
          0% { transform: scale(0.3); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        .cs-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          text-align: center;
          padding: 40px;
        }
        .cs-logo-wrap {
          filter: drop-shadow(0 4px 24px rgba(232, 123, 170, 0.25));
          animation: cs-float-logo 5s ease-in-out infinite;
        }
        @keyframes cs-float-logo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .cs-brand-name {
          font-size: 28px;
          font-weight: 700;
          color: #2d1a2e;
          letter-spacing: 0.02em;
          animation: cs-fade-up 0.8s ease 0.2s both;
        }
        .cs-sub-name {
          font-size: 14px;
          font-weight: 400;
          color: #9a6d95;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          animation: cs-fade-up 0.8s ease 0.4s both;
        }
        .cs-coming-soon {
          font-size: 42px;
          font-weight: 700;
          background: linear-gradient(135deg, #e87baa, #7c5aad);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: cs-fade-up 0.8s ease 0.6s both;
          line-height: 1.1;
          margin: 0;
        }
        .cs-dots {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          animation: cs-fade-up 0.8s ease 0.8s both;
        }
        .cs-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e87baa, #7c5aad);
          animation: cs-dot-pulse 1.6s ease-in-out infinite;
        }
        .cs-dot:nth-child(2) { animation-delay: 0.2s; }
        .cs-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes cs-dot-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .cs-footer {
          position: absolute;
          bottom: 24px;
          font-size: 11px;
          color: #c5adc8;
          letter-spacing: 0.08em;
          animation: cs-fade-up 0.8s ease 1s both;
        }
        .cs-footer a {
          color: #e87baa;
          text-decoration: none;
        }
        @keyframes cs-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
