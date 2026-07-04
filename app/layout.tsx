import type { Metadata } from "next";
import { Noto_Sans_Georgian, Noto_Serif_Georgian } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/app/providers";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "ბალანსი — გადახდების შედარება",
  description:
    "საბანკო ტრანზაქციების შედარება ხელშეკრულებებთან — ვინ გადაიხადა და ვინ არა",
};

const notoSans = Noto_Sans_Georgian({
  variable: "--font-sans",
  display: "swap",
  subsets: ["georgian", "latin"],
});

const notoSerif = Noto_Serif_Georgian({
  variable: "--font-display",
  display: "swap",
  subsets: ["georgian", "latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <body
        className={`${notoSans.variable} ${notoSerif.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
