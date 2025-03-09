import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Money Button | Mantle Network & Wormhole Bridge",
  description: "A gamified MNT betting platform with Wormhole bridge integration",
  icons: {
    icon: '/favicon.ico',
  },
};

// Cosmic Portal Background Component
const CosmicBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Main cosmic gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-[#08091D] via-[#0C0E20] to-[#070814] opacity-80"></div>
      
      {/* Portal effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] -z-20 opacity-10 bg-gradient-radial from-[#7B4DFF] via-[#2438E8]/20 to-transparent animate-pulse"></div>
      
      {/* Star field */}
      <div className="absolute inset-0 -z-10">
        {Array.from({ length: 150 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              opacity: Math.random() * 0.7 + 0.3,
              animation: `twinkle ${Math.random() * 5 + 3}s ease-in-out infinite ${Math.random() * 5}s`
            }}
          />
        ))}
      </div>
      
      {/* Nebula effects */}
      <div className="absolute top-[10%] right-[15%] w-[40vw] h-[30vh] rounded-full bg-gradient-radial from-[#7B4DFF]/10 to-transparent opacity-30 blur-3xl"></div>
      <div className="absolute bottom-[20%] left-[10%] w-[30vw] h-[40vh] rounded-full bg-gradient-radial from-[#4E5AFF]/10 to-transparent opacity-30 blur-3xl"></div>
      
      {/* Wormhole ring effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vmin] h-[50vmin] rounded-full border-[8px] border-[#7B4DFF]/20 opacity-60 pulse-portal"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vmin] h-[40vmin] rounded-full border-[5px] border-[#4E5AFF]/30 opacity-40 pulse-portal" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30vmin] h-[30vmin] rounded-full border-[3px] border-[#A47BFF]/40 opacity-20 pulse-portal" style={{ animationDelay: '1s' }}></div>
    </div>
  );
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white h-full overflow-hidden`}
      >
        <Providers>
          <CosmicBackground />
          <main className="h-full overflow-hidden">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
