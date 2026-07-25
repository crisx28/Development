import type { Metadata, Viewport } from "next";
import "./globals.css";

// Empty locally; "/<repo>" on GitHub Pages. Kept in sync via next.config.mjs.
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "DinkQueue — Open Play Rotation",
  description:
    "The live rotation manager for pickleball open play. Fair court time, balanced games, no whiteboard.",
  manifest: `${base}/manifest.json`,
  icons: {
    icon: [{ url: `${base}/icon.svg`, type: "image/svg+xml" }],
    apple: [{ url: `${base}/icon.svg` }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DinkQueue",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d7a5f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) {
              window.addEventListener('load', function () {
                navigator.serviceWorker.register('${base}/sw.js', { scope: '${base}/' }).catch(function(){});
              });
            }`,
          }}
        />
      </body>
    </html>
  );
}
