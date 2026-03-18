import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpaceWatch - What's Above You Right Now",
  description: "Real-time 3D satellite tracker. See what's flying over your head.",
  openGraph: {
    title: "SpaceWatch",
    description: "Real-time 3D satellite tracker",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
