"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert size={26} />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">რაღაც შეფერხდა</h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          მოულოდნელი შეცდომა მოხდა. სცადეთ თავიდან ან დაბრუნდით მთავარ გვერდზე.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          თავიდან ცდა
        </button>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-5 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          მთავარი
        </Link>
      </div>
    </main>
  );
}
