import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";
// import { ThemeProvider } from "@/components/theme-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const GA_ID = "G-FK7V939Q7M";
const isProduction = process.env.NODE_ENV === "production";

export const metadata: Metadata = {
  title: "Games Hub",
  description: "Drink responsibly and have fun with friends!",
  icons: {
    icon: "/favicon.svg", // or "/your-custom-name.png"
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TRPCReactProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {isProduction ? (
            <>
              <Script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                strategy="afterInteractive"
              />
              <Script id="google-analytics" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', { send_page_view: true });
                `}
              </Script>
            </>
          ) : null}
          <Toaster position="top-center" />

          {children}
        </body>
      </html>
    </TRPCReactProvider>
  );
}
