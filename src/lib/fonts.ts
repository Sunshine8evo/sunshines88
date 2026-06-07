import { DM_Sans } from "next/font/google";

export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

/** Apply optimized DM Sans + CSS variable on any page wrapper */
export const dmSansClass = `${dmSans.variable} ${dmSans.className}`;
