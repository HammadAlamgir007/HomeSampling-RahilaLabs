import "./globals.css"
import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@vercel/analytics/react"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.getRegistrations().then(registrations => {
                    for (let registration of registrations) {
                      registration.unregister();
                    }
                  }).catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
        <ToastContainer position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from "next"

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: "Rahila Labs | Premium Pathology Services",
    template: "%s | Rahila Labs",
  },
  description: "Advanced diagnostic testing and pathology services. Book appointments, track samples, and view reports online with Rahila Labs.",
  keywords: ["pathology", "blood test", "diagnostic center", "health checkup", "medical labs"],
  authors: [{ name: "Rahila Labs" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rahilalabs.com",
    title: "Rahila Labs | Premium Pathology Services",
    description: "Advanced diagnostic testing and pathology services. Book appointments, track samples, and view reports online with Rahila Labs.",
    siteName: "Rahila Labs",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rahila Labs | Premium Pathology Services",
    description: "Advanced diagnostic testing and pathology services. Book appointments, track samples, and view reports online with Rahila Labs.",
  },
};
