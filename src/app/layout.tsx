import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import ServiceWorker from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "HeritageHub — Discover local heritage events",
  description:
    "Discover, share, and RSVP to local cultural, spiritual, and community heritage events near you.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "HeritageHub" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#b91c1c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Apply saved theme before paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('hh-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />
        <div className="mx-auto min-h-screen max-w-app">{children}</div>
        <ServiceWorker />
      </body>
    </html>
  );
}
