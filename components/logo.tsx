import { cn } from "@/lib/utils";

export function PaymentsLogo({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="Payments"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient
          id="payments-logo-bg"
          x1="10"
          y1="4"
          x2="54"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4C84F8" />
          <stop offset="1" stopColor="#1D4FE0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#payments-logo-bg)" />
      <path
        d="M34 20h10v14h5.5L39 47 28.5 34H34V20Z"
        fill="#BFD3FA"
      />
      <path
        d="M15 30 27 16l12 14h-6v16H21V30h-6Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}
