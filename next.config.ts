import type { NextConfig } from "next";

const securityHeaders = [
  // HTTPS-ის იძულება — ბრაუზერი ერთხელ ჩატვირთვის შემდეგ მხოლოდ HTTPS-ს იყენებს
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // clickjacking-ის დაცვა — საიტი iframe-ში ვერ ჩაიტვირთება
  { key: "X-Frame-Options", value: "DENY" },
  // MIME-sniffing-ის აკრძალვა
  { key: "X-Content-Type-Options", value: "nosniff" },
  // referrer-ის გაჟონვის შეზღუდვა
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // ბრაუზერის API-ების გამორთვა, რომლებსაც აპი არ იყენებს
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Content-Security-Policy — რესურსების მკაცრი წყაროები
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  devIndicators: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
