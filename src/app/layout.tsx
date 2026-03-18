import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpaceWatch - What's Above You Right Now",
  description: "Real-time 3D satellite tracker. See what's flying over your head.",
  openGraph: {
    title: "SpaceWatch",
    description: "Real-time 3D satellite tracker. See what's flying over your head.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
